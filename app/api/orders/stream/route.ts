import { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongo';
import { getAuthUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Disable SSE on Vercel production environment
    // Vercel's serverless functions don't support long-lived connections like SSE with MongoDB Change Streams
    if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL) {
      console.log('SSE disabled on Vercel production environment');
      return new Response(
        JSON.stringify({
          error: 'Server-Sent Events are not supported in this environment',
          message: 'Real-time updates are disabled on serverless platforms. The application will use polling for updates.',
          fallback: 'polling'
        }),
        { 
          status: 501,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Cache-Control',
          }
        }
      );
    }

    // Public endpoint: no authentication required for menu/guest access
    // const user = getAuthUser(request);
    // if (!user) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    // Get outlet ID from query params
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');
    
    if (!outletId) {
      return new Response('Outlet ID is required', { status: 400 });
    }

    console.log(`Starting SSE stream for outlet: ${outletId}`);

    const client = await connectToMongo();
    const db = client.db();
    const ordersCollection = db.collection('orders');

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        console.log(`SSE stream started for outlet: ${outletId}`);
        
        let changeStream: any = null;
        let isClosed = false;

        // Helper function to safely enqueue data
        const safeEnqueue = (data: string) => {
          if (!isClosed) {
            try {
              controller.enqueue(new TextEncoder().encode(data));
            } catch (error) {
              console.error('Error enqueueing data:', error);
              isClosed = true;
              if (changeStream) {
                try {
                  changeStream.removeAllListeners();
                  changeStream.close();
                } catch (e) {
                  console.error('Error closing change stream after enqueue error:', e);
                }
              }
            }
          }
        };

        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to order stream',
          timestamp: new Date().toISOString(),
          outletId
        })}\n\n`;
        safeEnqueue(initialMessage);

        try {
          // Validate ObjectId format
          if (!ObjectId.isValid(outletId)) {
            throw new Error('Invalid outlet ID format');
          }

          // Create change stream with filter for the specific outlet
          const pipeline = [
            {
              $match: {
                'fullDocument.outletId': new ObjectId(outletId),
                $or: [
                  { operationType: 'insert' },
                  { operationType: 'update' },
                  { operationType: 'replace' }
                ]
              }
            }
          ];

          changeStream = ordersCollection.watch(pipeline, {
            fullDocument: 'updateLookup',
            fullDocumentBeforeChange: 'whenAvailable'
          });

          console.log(`Change stream created for outlet: ${outletId}`);

          // Listen for changes
          changeStream.on('change', (change: any) => {
            if (isClosed) return;

            console.log('Order change detected:', {
              operationType: change.operationType,
              orderId: change.fullDocument?.orderId,
              outletId: change.fullDocument?.outletId
            });

            try {
              let eventType = 'order-updated';
              
              // Determine event type based on operation
              if (change.operationType === 'insert') {
                eventType = 'new-order';
              } else if (change.operationType === 'update' || change.operationType === 'replace') {
                // Check if order is completed
                const order = change.fullDocument;
                if (order && order.orderStatus === 'served' && order.paymentStatus === 'paid') {
                  eventType = 'order-completed';
                } else {
                  eventType = 'order-updated';
                }
              }

              const message = `data: ${JSON.stringify({
                type: eventType,
                order: change.fullDocument,
                operationType: change.operationType,
                timestamp: new Date().toISOString()
              })}\n\n`;

              safeEnqueue(message);
              console.log(`SSE message sent: ${eventType} for order ${change.fullDocument?.orderId}`);
            } catch (error) {
              console.error('Error processing change event:', error);
            }
          });

          changeStream.on('error', (error: any) => {
            console.error('Change stream error:', error);
            if (!isClosed) {
              const errorMessage = `data: ${JSON.stringify({
                type: 'error',
                message: 'Stream error occurred',
                error: error.message,
                timestamp: new Date().toISOString()
              })}\n\n`;
              safeEnqueue(errorMessage);
            }
          });

          changeStream.on('close', () => {
            console.log(`Change stream closed for outlet: ${outletId}`);
            isClosed = true;
            if (!controller.desiredSize === null) {
              try {
                controller.close();
              } catch (error) {
                console.error('Error closing controller:', error);
              }
            }
          });

        } catch (error) {
          console.error('Error setting up change stream:', error);
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to setup change stream',
            error: (error as Error).message,
            timestamp: new Date().toISOString()
          })}\n\n`;
          safeEnqueue(errorMessage);
          isClosed = true;
          try {
            controller.close();
          } catch (closeError) {
            console.error('Error closing controller after setup error:', closeError);
          }
        }

        // Return cleanup function
        return () => {
          console.log(`Cleaning up change stream for outlet: ${outletId}`);
          isClosed = true;
          if (changeStream) {
            try {
              changeStream.removeAllListeners();
              changeStream.close();
            } catch (error) {
              console.error('Error closing change stream:', error);
            }
          }
        };
      },

      cancel() {
        console.log(`SSE stream cancelled for outlet: ${outletId}`);
      }
    });

    // Return SSE response
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE endpoint error:', error);
    return new Response(`Internal Server Error: ${(error as Error).message}`, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
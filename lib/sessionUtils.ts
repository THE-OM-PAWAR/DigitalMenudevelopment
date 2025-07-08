// Session utilities for isolating user orders
export function generateSessionId(): string {
  // Generate a unique session ID for this browser session
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  return `session_${timestamp}_${randomStr}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  
  const storageKey = 'user_session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_session_id');
  }
}
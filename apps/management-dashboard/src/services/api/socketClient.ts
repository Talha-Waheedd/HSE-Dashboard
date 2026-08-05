import { useAuthStore } from '@cbl/auth';

type Listener = (...args: any[]) => void;

class SocketAdapter {
  private realSocket: any = null;
  private listeners = new Map<string, Set<Listener>>();
  auth: Record<string, unknown> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    this.realSocket?.on(event, listener);
    return this;
  }

  off(event: string, listener?: Listener) {
    if (listener) this.listeners.get(event)?.delete(listener);
    else this.listeners.delete(event);
    this.realSocket?.off(event, listener);
    return this;
  }

  async connect() {
    if (!this.realSocket) {
      const baseUrl = import.meta.env?.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      const module = await import(/* @vite-ignore */ 'socket.io-client');
      this.realSocket = module.io(baseUrl, { auth: this.auth, autoConnect: false });
      this.listeners.forEach((listeners, event) => listeners.forEach((listener) => this.realSocket.on(event, listener)));
    }
    this.realSocket.auth = this.auth;
    this.realSocket.connect();
  }

  disconnect() {
    this.realSocket?.disconnect();
  }
}

const socket = new SocketAdapter();

export const getSocket = () => socket;

export const connectSocket = () => {
  const token = useAuthStore.getState().token;
  if (token) {
    socket.auth = { token };
    socket.connect().catch((error) => console.error('Socket connection failed', error));
  }
};

export const disconnectSocket = () => socket.disconnect();

declare module 'socket.io-client' {
  export interface Socket {
    auth: Record<string, unknown>;
    connect(): void;
    disconnect(): void;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener?: (...args: any[]) => void): this;
  }

  export function io(url: string, options?: Record<string, unknown>): Socket;
}

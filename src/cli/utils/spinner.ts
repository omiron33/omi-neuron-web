type SpinnerState = 'running' | 'stopped';

export class Spinner {
  private state: SpinnerState = 'stopped';
  private intervalId: NodeJS.Timeout | null = null;
  private frames = ['-', '\\', '|', '/'];
  private frameIndex = 0;

  constructor(private message: string) {}

  start(): void {
    if (this.state === 'running') return;
    this.state = 'running';
    this.intervalId = setInterval(() => {
      const frame = this.frames[this.frameIndex % this.frames.length];
      this.frameIndex += 1;
      process.stdout.write(`\r${frame} ${this.message}`);
    }, 120);
  }

  stop(success = true, finalMessage?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.state = 'stopped';
    const symbol = success ? '✓' : '✗';
    process.stdout.write(`\r${symbol} ${finalMessage ?? this.message}\n`);
  }
}

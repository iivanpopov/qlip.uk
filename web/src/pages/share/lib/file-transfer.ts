const CHUNK_SIZE = 16 * 1024

interface FileTransport {
  readonly isOpen: boolean
  send(message: string | ArrayBuffer): void
}

type Metadata = { type: 'start'; name: string; mime: string; size: number } | { type: 'end' }

interface Incoming {
  name: string
  mime: string
  size: number
  chunks: ArrayBuffer[]
}

export class FileTransfer {
  private outgoing: File[] = []
  private incoming: Incoming | null = null
  private sending: Promise<void> | null = null

  constructor(
    private readonly transport: FileTransport,
    private readonly onFile: (file: File) => void,
  ) {}

  enqueue(file: File) {
    this.outgoing.push(file)
    return this.flush()
  }

  flush(): Promise<void> {
    if (this.sending) return this.sending
    if (!this.transport.isOpen || !this.outgoing.length) return Promise.resolve()

    const queue = this.outgoing

    this.sending = Promise.resolve().then(async () => {
      try {
        while (queue.length && this.transport.isOpen && queue === this.outgoing) {
          const file = queue[0]
          this.transport.send(
            JSON.stringify({ type: 'start', name: file.name, mime: file.type, size: file.size }),
          )

          for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
            const chunk = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer()
            if (queue !== this.outgoing || !this.transport.isOpen) return
            this.transport.send(chunk)
          }

          this.transport.send(JSON.stringify({ type: 'end' }))
          queue.shift()
        }
      } finally {
        this.sending = null
      }
    })

    return this.sending
  }

  receive(message: string | ArrayBuffer) {
    if (typeof message !== 'string') return this.incoming?.chunks.push(message)

    const metadata: Metadata = JSON.parse(message)

    if (metadata.type === 'start') {
      this.incoming = { name: metadata.name, mime: metadata.mime, size: metadata.size, chunks: [] }
    } else if (metadata.type === 'end' && this.incoming) {
      const { chunks, name, mime, size } = this.incoming
      this.resetIncoming()
      const file = new File(chunks, name, { type: mime })
      if (file.size !== size) return
      this.onFile(file)
    }
  }

  resetIncoming() {
    this.incoming = null
  }

  clear() {
    this.outgoing = []
    this.resetIncoming()
  }
}

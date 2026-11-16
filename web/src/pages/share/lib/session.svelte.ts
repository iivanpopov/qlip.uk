import { generateFileName } from '../utils'

import { Connection } from './connection.svelte'
import { FileTransfer } from './file-transfer'

export class Session {
  received = $state<File[]>([])

  private connection: Connection
  private transfer: FileTransfer

  constructor({ room, clientId }: { room: string; clientId: string }) {
    this.connection = new Connection({
      room,
      clientId,
      onMessage: (message) => this.transfer.receive(message),
      onOpen: () => void this.transfer.flush().catch(console.error),
      onClose: () => this.transfer.resetIncoming(),
    })
    this.transfer = new FileTransfer(this.connection, (file) => this.received.push(file))
  }

  get status() {
    return this.connection.status
  }

  connect(token: string) {
    return this.connection.connect(token)
  }

  async send({ files, text }: { files: readonly File[]; text: string }) {
    if (files.length) {
      await Promise.all(files.map((file) => this.transfer.enqueue(file)))
      return
    }

    if (!text) return

    const type = 'text/plain'
    await this.transfer.enqueue(new File([text], generateFileName(type), { type }))
  }

  dispose() {
    this.transfer.clear()
    this.received = []
    void this.connection.close()
  }
}

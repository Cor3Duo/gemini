import { Payload } from "./api/payload.api";
import { HistoryManager } from "./history_manager";
import WebSocket from "ws";

export class GeminiClient {

  historyManager: HistoryManager;

  constructor(
    private _ws: WebSocket
  ) {
    this.historyManager = new HistoryManager(this);
  }

  send(object: Payload) {
    return new Promise<{ text: string, functionCalls?: { name: string, args: { [key: string]: any } }[] }>((resolve, reject) => {
      this._ws.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });

      this._ws.send(JSON.stringify(object));
    })
  }

  close() {
    this._ws.close();
  }

}
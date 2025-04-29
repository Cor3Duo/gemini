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
    return new Promise<string>((resolve, reject) => {
      this._ws.once('message', (data) => {
        resolve(data.toString());
      });

      this._ws.send(JSON.stringify(object));
    })
  }

  close() {
    this._ws.close();
  }

}
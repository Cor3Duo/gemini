import { WebSocketServer } from 'ws';
import readline from 'readline/promises';
import { GeminiClient } from './gemini_client';
import fs from 'fs';
import { exec } from 'child_process';

type Callback = (...args: any[]) => void;

const PORT = 9090;
const REQUEST_TIMEOUT_MS = 30000;

const clients: Map<number, GeminiClient> = new Map();
let nextClientId = 1;
let pendingRequest: Callback | null = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
  console.log(`[Server] WebSocket server listening on port ${PORT}...`);
});

wss.on('connection', (ws, req) => {
  const clientId = nextClientId++;
  const clientIp = req.socket.remoteAddress;
  clients.set(clientId, new GeminiClient(ws));
  console.log(`[Server] Client ${clientId} connected from ${clientIp}. Total clients: ${clients.size}`);

  ws.on('close', (code, reason) => {
    console.log(`[Server] Client ${clientId} disconnected. Code: ${code}, Reason: ${reason || 'N/A'}. Total clients: ${clients.size - 1}`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`[Server] Error on Client ${clientId}:`, error);
    clients.delete(clientId);
    if (ws.readyState !== WebSocket.CLOSED) {
      ws.terminate();
    }
  });
});

wss.on('error', (error) => {
  console.error('[Server] WebSocket Server Error:', error);
});

(async function main() {
  console.log('Type your message to send to the first connected client, or type "exit" to quit.');

  while (true) {
    const input = await rl.question('You > ');

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      break;
    }

    if (clients.size === 0) {
      console.log('[Server] No clients connected. Please wait for a client.');
      continue;
    }

    const [targetClientId, client] = clients.entries().next().value!;

    if (!client) {
      console.error("[Server] Failed to get the first client. This shouldn't happen if size > 0.");
      continue;
    }

    try {
      let response = await client.historyManager
        .addText('user', input)
        .getResponse();

      response.text && client.historyManager.addText('model', response.text);

      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          client.historyManager.addFunctionCall(call.name, call.args);
          switch (call.name) {
            case 'create_file':
              fs.writeFileSync(call.args.path, call.args.content);
              client.historyManager.addFunctionResponse(call.name, 'File created successfully.');
              break;
            case 'execute_command':
              exec(call.args.command, (error, stdout, stderr) => {
                client.historyManager.addFunctionResponse(call.name, stdout);
                console.log(`Gemini (Client ${targetClientId}) > ${stdout}`);
              });
              break;
            case 'read_file':
              client.historyManager.addFunctionResponse(call.name, fs.readFileSync(call.args.path, 'utf-8'));
              break;
          }
        }

        response = await client.historyManager.getResponse();
        response.text && client.historyManager.addText('model', response.text);
      }

      console.log(`Gemini (Client ${targetClientId}) > ${response.text}`);
    } catch (error: any) {
      console.error(`[Server] Failed  to get response from Client${targetClientId}:`, error.message);
    }
  }

  // --- Encerramento Limpo ---
  console.log('[Server] Shutting down...');
  rl.close(); // Fecha a interface readline

  // Fecha todas as conexões de clientes
  for (const [clientId, client] of clients.entries()) {
    console.log(`[Server] Closing connection to Client ${clientId}...`);
    client.close();
  }

  // Fecha o servidor WebSocket
  wss.close((err) => {
    if (err) {
      console.error('[Server] Error closing WebSocket server:', err);
    } else {
      console.log('[Server] WebSocket server closed.');
    }
    // Garante que o processo termine mesmo se houver timers pendentes (embora devessem ter sido limpos)
    process.exit(err ? 1 : 0);
  });

  // Dê um tempo para o fechamento antes de forçar a saída (fallback)
  setTimeout(() => {
    console.log('[Server] Forcing exit after timeout.');
    process.exit(1);
  }, 5000);


})().catch(error => {
  // Captura erros não tratados no loop principal ou no encerramento
  console.error("[Server] Unhandled error in main execution:", error);
  process.exit(1);
});
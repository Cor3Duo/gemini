// Importações necessárias
const WebSocket = require('ws');
const readline = require('readline/promises'); // Usar a versão Promise do readline
const { v4: uuidv4 } = require('uuid'); // Para gerar IDs únicos para mensagens

// --- Configuração ---
const PORT = 9090; // Porta para o servidor WebSocket
const REQUEST_TIMEOUT_MS = 30000; // Tempo limite para esperar resposta (30 segundos)

// --- Estado do Servidor ---
const clients = new Map(); // Usar um Map para gerenciar clientes (clientId -> ws)
let nextClientId = 1;
const pendingRequests = new Map(); // Armazena promessas pendentes (messageId -> { resolve, reject, timer })

// --- Interface de Linha de Comando ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// --- Funções Auxiliares ---

/**
 * Envia uma mensagem para um cliente específico e espera por uma resposta correlacionada.
 * @param {WebSocket} ws O objeto WebSocket do cliente.
 * @param {number} clientId O ID do cliente para logging.
 * @param {string} message O texto da mensagem a ser enviada.
 * @returns {Promise<string>} A resposta do cliente.
 */
function sendMessageAndWaitForResponse(ws, clientId, message) {
  return new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      return reject(new Error(`Client ${clientId} is not connected.`));
    }

    const messageId = uuidv4(); // ID único para esta requisição

    // Timeout para a requisição
    const timer = setTimeout(() => {
      pendingRequests.delete(messageId); // Limpa a requisição pendente
      reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`));
    }, REQUEST_TIMEOUT_MS);

    // Armazena os callbacks da Promise para serem chamados quando a resposta chegar
    pendingRequests.set(messageId, { resolve, reject, timer });

    // Payload da mensagem a ser enviada ao cliente
    const payload = JSON.stringify({
      messageId: messageId, // Inclui o ID para correlação
      prompt: message, // Campo com a mensagem/prompt
    });

    // Tenta enviar a mensagem
    try {
      ws.send(payload);
      console.log(`[Server -> Client ${clientId}] Sent (ID: ${messageId}): ${message}`);
    } catch (error) {
      console.error(`[Server] Error sending message to Client ${clientId}:`, error);
      clearTimeout(timer); // Limpa o timeout
      pendingRequests.delete(messageId); // Limpa a requisição pendente
      reject(error); // Rejeita a promise
    }
  });
}

// --- Lógica do Servidor WebSocket ---
const wss = new WebSocket.Server({ port: PORT });

wss.on('listening', () => {
  console.log(`[Server] WebSocket server listening on port ${PORT}...`);
});

wss.on('connection', (ws, req) => {
  const clientId = nextClientId++;
  const clientIp = req.socket.remoteAddress;
  clients.set(clientId, ws);
  console.log(`[Server] Client ${clientId} connected from ${clientIp}. Total clients: ${clients.size}`);

  // Handler para mensagens recebidas do cliente
  ws.on('message', (data) => {
    try {
      // Converte o buffer para string e faz o parse do JSON
      const messageString = data.toString();
      const dataObj = JSON.parse(messageString);

      // Verifica se a mensagem tem um messageId e se corresponde a uma requisição pendente
      if (dataObj.messageId && pendingRequests.has(dataObj.messageId)) {
        const { resolve, timer } = pendingRequests.get(dataObj.messageId);
        clearTimeout(timer); // Cancela o timeout, pois a resposta chegou

        // Extrai a resposta (assumindo que está no campo 'response')
        const response = dataObj.response || dataObj.message || 'No response content'; // Adapte conforme necessário
        // console.log(`[Client ${clientId} -> Server] Received (ID: ${dataObj.messageId}): ${response.substring(0, 80)}...`);

        resolve(response); // Resolve a Promise da requisição correspondente
        pendingRequests.delete(dataObj.messageId); // Remove a requisição da lista de pendentes
      } else {
        // Mensagem não correlacionada ou sem ID
        console.log(`[Client ${clientId}] Received unsolicited message:`, messageString);
        // Você pode querer fazer algo com mensagens não solicitadas aqui
      }
    } catch (error) {
      console.error(`[Client ${clientId}] Error processing message: ${error.message}. Raw data:`, data.toString());
      // Não quebra o servidor se o JSON for inválido
    }
  });

  // Handler para fechamento da conexão
  ws.on('close', (code, reason) => {
    console.log(`[Server] Client ${clientId} disconnected. Code: ${code}, Reason: ${reason || 'N/A'}. Total clients: ${clients.size - 1}`);
    clients.delete(clientId);
    // Opcional: Rejeitar todas as promises pendentes para este cliente
    for (const [msgId, request] of pendingRequests.entries()) {
      // Precisaria armazenar o clientId em 'request' para fazer isso de forma limpa.
      // Por simplicidade, vamos confiar no timeout para limpar as pendências.
    }
  });

  // Handler para erros na conexão do cliente
  ws.on('error', (error) => {
    console.error(`[Server] Error on Client ${clientId}:`, error);
    clients.delete(clientId); // Remove o cliente se ocorrer um erro
    // A conexão geralmente fecha automaticamente após um erro, mas podemos garantir
    if (ws.readyState !== WebSocket.CLOSED) {
      ws.terminate(); // Força o fechamento
    }
  });
});

// Handler para erros do servidor WebSocket em si
wss.on('error', (error) => {
  console.error('[Server] WebSocket Server Error:', error);
});

// --- Loop Principal da Aplicação ---
(async function main() {
  console.log('Type your message to send to the first connected client, or type "exit" to quit.');

  while (true) { // Loop iterativo em vez de recursivo
    const input = await rl.question('You > ');

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      break; // Sai do loop
    }

    if (clients.size === 0) {
      console.log('[Server] No clients connected. Please wait for a client.');
      continue; // Pula para a próxima iteração do loop
    }

    // Pega o primeiro cliente conectado (o comportamento original)
    // Iterators de Map retornam [key, value]
    const [targetClientId, targetWs] = clients.entries().next().value;

    if (!targetWs) {
      console.error("[Server] Failed to get the first client. This shouldn't happen if size > 0.");
      continue;
    }

    try {
      // Envia a mensagem e espera a resposta com timeout
      const response = await sendMessageAndWaitForResponse(targetWs, targetClientId, input);
      console.log(`Gemini (Client ${targetClientId}) > ${response}`);
    } catch (error) {
      console.error(`[Server] Failed to get response from Client ${targetClientId}:`, error.message);
      // Se o erro foi de conexão, o cliente pode já ter sido removido pelos handlers 'close'/'error'
      // Se foi timeout, a requisição já foi limpa.
    }
  }

  // --- Encerramento Limpo ---
  console.log('[Server] Shutting down...');
  rl.close(); // Fecha a interface readline

  // Fecha todas as conexões de clientes
  for (const [clientId, ws] of clients.entries()) {
    console.log(`[Server] Closing connection to Client ${clientId}...`);
    ws.close();
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
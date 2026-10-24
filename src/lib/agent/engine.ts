import { getSystemPrompt } from './prompt';
import { AGENT_TOOLS, runAgentTool } from './tools';
import { AgentStep, ChatMessage } from '../types';

interface AgentResponse {
  answer: string;
  steps: AgentStep[];
  sqlQuery?: string;
}

/**
 * Main Agent Execution Engine.
 * Invokes the autonomous ReAct AI agent loop with tool execution.
 */
export async function executeAgentChat(
  userQuery: string,
  history: ChatMessage[] = []
): Promise<AgentResponse> {
  const q = userQuery.toLowerCase().trim();

  // Instant identity and greeting handler
  const isWhoAreYou = /who are you|what are you|tell me about yourself|what.s your (name|role|purpose)/i.test(q);
  const isHowAreYou = /how are you|how.re you|how.s it going|you okay/i.test(q);
  const isGreeting = /^(hi|hello|hey|howdy|greetings|good (morning|afternoon|evening))\b/i.test(q);
  const isThanks = /^(thanks|thank you|thx|cheers|appreciate|great|awesome|perfect|cool)/i.test(q);

  if (isWhoAreYou) {
    return {
      answer: `I'm Livensa's internal ad performance AI analyst with access to your Meta and TikTok campaign data warehouse, build logs, and marketing rules.\n\nI can help you analyze spend, acquisition costs (CAC & CPT), trial-to-subscription conversion, channel comparisons, and correlate metrics with app releases.`,
      steps: [],
    };
  }

  if (isHowAreYou) {
    return {
      answer: `I'm doing great, thanks! Ready to analyze your advertising campaigns. What would you like to explore?`,
      steps: [],
    };
  }

  if (isGreeting || isThanks) {
    return {
      answer: `Hey there! Ask me anything about your campaigns — spend, CAC, trial-to-subscription rates, channel comparisons, or release impacts.`,
      steps: [],
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      return await executeGeminiAgent(userQuery, history, geminiKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Gemini Agent Execution Error:', err);
      return {
        answer: `I encountered an issue running the AI analysis: ${msg}. Please check your connection or API key.`,
        steps: [
          {
            type: 'thought',
            title: 'Agent Error',
            content: `Failed to execute agent: ${msg}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }

  if (openaiKey) {
    try {
      return await executeOpenAIAgent(userQuery, history, openaiKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('OpenAI Agent Execution Error:', err);
      return {
        answer: `I encountered an issue running the AI analysis: ${msg}.`,
        steps: [],
      };
    }
  }

  return {
    answer: "No AI API key is configured. Please provide a `GEMINI_API_KEY` in your `.env` file to enable the AI Analyst Copilot.",
    steps: [],
  };
}

/**
 * Google Gemini implementation with function calling loop
 */
async function executeGeminiAgent(
  userQuery: string,
  history: ChatMessage[],
  apiKey: string
): Promise<AgentResponse> {
  const steps: AgentStep[] = [];
  const systemPrompt = getSystemPrompt();

  // Compress previous conversation history to preserve context budget
  const recentHistory = history.slice(-6).map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));

  const contents: Array<{ role: string; parts: any[] }> = [
    ...recentHistory,
    { role: 'user', parts: [{ text: userQuery }] },
  ];

  // Gemini tools formatting
  const functionDeclarations = AGENT_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(t.parameters.properties).map(([k, v]) => [
          k,
          { type: v.type.toUpperCase(), description: v.description },
        ])
      ),
      required: t.parameters.required,
    },
  }));

  const modelName = 'gemini-3.5-flash-lite';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  let iterations = 0;
  const maxIterations = 5;
  let finalAnswer = '';
  let lastExecutedSql = '';

  while (iterations < maxIterations) {
    iterations++;

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools: [{ functionDeclarations }],
      generationConfig: {
        temperature: 0.1,
      },
    };

    let res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // If primary lite model encounters an issue, fallback to gemini-flash-lite-latest
      const backupEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
      res = await fetch(backupEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content;
    const parts = content?.parts || [];

    let toolCallPart: { functionCall?: { name: string; args: Record<string, unknown> } } | null = null;
    let textPart = '';

    for (const part of parts) {
      if (part.functionCall) {
        toolCallPart = part;
      }
      if (part.text) {
        textPart += part.text;
      }
    }

    if (toolCallPart?.functionCall && content) {
      const call = toolCallPart.functionCall;
      steps.push({
        type: 'thought',
        title: 'Model Reasoning',
        content: `Calling tool: ${call.name}`,
        timestamp: new Date().toISOString(),
      });

      if (call.name === 'execute_sql' && call.args?.query) {
        lastExecutedSql = String(call.args.query);
      }

      const { result, step } = runAgentTool(call.name, call.args || {});
      steps.push(step);

      // Preserve model's complete candidate content (including thoughtSignature) in the conversation
      contents.push(content);
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: call.name,
              response: { result },
            },
          },
        ],
      });
    } else {
      finalAnswer = textPart || 'I could not generate an answer based on the provided parameters.';
      break;
    }
  }

  return {
    answer: finalAnswer,
    steps,
    sqlQuery: lastExecutedSql || undefined,
  };
}

/**
 * OpenAI implementation with function calling loop
 */
async function executeOpenAIAgent(
  userQuery: string,
  history: ChatMessage[],
  apiKey: string
): Promise<AgentResponse> {
  const steps: AgentStep[] = [];
  const systemPrompt = getSystemPrompt();

  const recentHistory = history.slice(-6).map(h => ({
    role: h.role,
    content: h.content,
  }));

  const messages: Array<{ role: string; content?: string | null; tool_calls?: unknown[]; tool_call_id?: string }> = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: userQuery },
  ];

  const tools = AGENT_TOOLS.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  let iterations = 0;
  const maxIterations = 5;
  let finalAnswer = '';
  let lastExecutedSql = '';

  while (iterations < maxIterations) {
    iterations++;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const tc of message.tool_calls) {
        const name = tc.function.name;
        const args = JSON.parse(tc.function.arguments || '{}');

        if (name === 'execute_sql' && args.query) {
          lastExecutedSql = String(args.query);
        }

        steps.push({
          type: 'thought',
          title: 'Agent Strategy',
          content: `Invoking tool ${name}`,
          timestamp: new Date().toISOString(),
        });

        const { result, step } = runAgentTool(name, args);
        steps.push(step);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    } else {
      finalAnswer = message?.content || 'Unable to generate response.';
      break;
    }
  }

  return {
    answer: finalAnswer,
    steps,
    sqlQuery: lastExecutedSql || undefined,
  };
}

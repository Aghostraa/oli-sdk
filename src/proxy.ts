import type { IncomingMessage, ServerResponse } from 'http';

export interface ProxyHandlerOptions {
  /** API key to inject into upstream requests */
  apiKey: string;
  /** Base URL for the OLI API */
  baseUrl?: string;
  /** Optional request header allow list */
  forwardHeaders?: string[];
  /** Optional hook to rewrite the upstream path */
  pathRewrite?: (originalPath: string) => string;
}

/**
 * Create an Express/Next.js compatible middleware that forwards requests to the OLI API
 * with the required `x-api-key` header automatically injected.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createProxyHandler } from '@openlabels/oli-sdk/proxy';
 *
 * const app = express();
 * app.use('/oli', createProxyHandler({ apiKey: process.env.OLI_API_KEY! }));
 * ```
 */
export function createProxyHandler(options: ProxyHandlerOptions) {
  const baseUrl = options.baseUrl ?? 'https://api.openlabelsinitiative.org';
  const allowList = options.forwardHeaders?.map(h => h.toLowerCase());

  if (!options.apiKey) {
    throw new Error('createProxyHandler requires an API key');
  }

  return async function proxyHandler(
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
    next?: (error?: unknown) => void
  ) {
    try {
      if (!req.url) {
        res.statusCode = 400;
        res.end('Proxy request missing URL');
        return;
      }

      const upstreamPath = options.pathRewrite ? options.pathRewrite(req.url) : req.url;
      const targetUrl = new URL(upstreamPath, baseUrl);
      const method = req.method ?? 'GET';

      const headers: Record<string, string> = {};
      if (allowList && req.headers) {
        for (const [key, value] of Object.entries(req.headers)) {
          if (!key || !allowList.includes(key.toLowerCase())) continue;
          if (Array.isArray(value)) {
            headers[key] = value.join(',');
          } else if (value !== undefined) {
            headers[key] = value;
          }
        }
      } else if (req.headers) {
        for (const [key, value] of Object.entries(req.headers)) {
          if (!key || key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') continue;
          if (Array.isArray(value)) {
            headers[key] = value.join(',');
          } else if (value !== undefined) {
            headers[key] = value;
          }
        }
      }

      headers['x-api-key'] = options.apiKey;

      let bodyBuffer: Buffer | undefined;
      if (!['GET', 'HEAD'].includes(method) && req.readable !== false) {
        bodyBuffer = await readRequestBody(req);
        headers['content-length'] = bodyBuffer.length.toString();
      }

      const bodyInit = bodyBuffer ? new Uint8Array(bodyBuffer) : undefined;

      const response = await fetch(targetUrl, {
        method,
        headers,
        body: bodyInit,
        redirect: 'manual'
      });

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'content-length') return;
        res.setHeader(key, value);
      });

      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } catch (error) {
      if (typeof next === 'function') {
        next(error);
        return;
      }
      res.statusCode = 502;
      res.end(`Proxy error: ${(error as Error).message}`);
    }
  };
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

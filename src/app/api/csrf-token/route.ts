/**
 * CSRF Token API Endpoint
 * Provides CSRF tokens for client-side applications
 */

import { NextRequest } from 'next/server';
import { createCSRFTokenResponse } from '@/lib/csrf-protection';

export async function GET(request: NextRequest) {
  return createCSRFTokenResponse();
}

export async function POST(request: NextRequest) {
  return createCSRFTokenResponse();
}

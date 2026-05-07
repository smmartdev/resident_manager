import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 500, details?: string) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status }
  );
}

export function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
}
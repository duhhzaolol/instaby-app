import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const onboarding = await prisma.onboarding.update({
    where: { id: params.id },
    data: { ...(body.status !== undefined && { status: body.status }) },
  });
  return NextResponse.json(onboarding);
}

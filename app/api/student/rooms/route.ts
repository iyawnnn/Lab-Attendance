import { NextResponse } from "next/server";
import { getLabRooms } from "@/app/actions";

export async function GET() {
  try {
    const result = await getLabRooms();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: [] }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: result.data }, 
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, data: [] }, 
      { status: 500 }
    );
  }
}
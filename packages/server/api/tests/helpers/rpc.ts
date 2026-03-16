type ApiResponse<T> =
	| { success: true; data: T }
	| { success: false; [key: string]: unknown };

export async function unwrap<T>(
	req: Promise<{ json(): Promise<ApiResponse<T>> }>,
): Promise<T> {
	const res = await req;
	const data = await res.json();
	if (!data.success) throw new Error("Request failed");
	return data.data;
}

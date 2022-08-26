export default class ErrorSerializer {
    static serializeError(
        status: number,
        message: string,
    ): { errors: { status: number; detail: string }[] } {
        return {
            errors: [
                {
                    status,
                    detail: message,
                },
            ],
        };
    }
}

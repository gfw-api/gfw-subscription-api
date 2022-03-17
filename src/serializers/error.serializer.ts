export default class ErrorSerializer {
    static serializeValidationError(
        data: Record<string, any>,
        typeParam: string,
    ): Record<string, any> {
        const keys: string[] = Object.keys(data);
        let message: string;
        switch (typeParam) {
            case 'body':
                message = 'Invalid body parameter';
                break;
            case 'query':
                message = 'Invalid query parameter';
                break;
            default:
                message = '';
        }
        return {
            source: {
                parameter: keys[0],
            },
            code: message.replace(/ /g, '_').toLowerCase(),
            title: message,
            detail: data[keys[0]],
        };
    }

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

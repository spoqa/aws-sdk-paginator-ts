import { Request } from 'aws-sdk/lib/request';
import { Response } from 'aws-sdk/lib/response';

export async function* pages<D>(req: Request<D, any>): AsyncIterableIterator<D> {
    let nextReq: Request<D, any> | void = req;
    while (nextReq != null) {
        const res: Response<D, any> = (await nextReq.promise()).$response;
        if (!res.data) {
            return;
        }
        yield res.data;
        if (!nextReq.isPageable()) {
            return;
        }
        nextReq = res.nextPage(undefined as any);
    }
}

export type Item<D extends { [T in K]?: any }, K extends string | number | symbol>
    = Required<D>[K] extends Iterable<infer U>
    ? U
    : never;

export async function* items<D extends { [T in K]?: any }, K extends string | number | symbol>(
    req: Request<D, any>,
    key: K,
): AsyncIterableIterator<Item<D, K>> {
    for await (const page of pages(req)) {
        const items: Iterable<Item<D, K>> | undefined = page[key];
        if (!items) { continue; }
        for (const i of items) {
            yield i;
        }
    }
}

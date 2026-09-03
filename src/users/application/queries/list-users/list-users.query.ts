export class ListUsersQuery {
  constructor(
    public readonly email?: string,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}

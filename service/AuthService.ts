export interface IUserInfo {
    id: string;
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
    accountType: string;
}

export interface IRegisterRequest {
    name: string;
    lastName: string;
    username: string;
    birthDate: string;
}
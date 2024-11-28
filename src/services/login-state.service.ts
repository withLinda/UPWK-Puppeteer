export class LoginStateService {
    private state = {
        emailVerified: false,
        passwordFieldReady: false,
        passwordEntered: false
    };

    get emailVerified(): boolean {
        return this.state.emailVerified;
    }

    get passwordFieldReady(): boolean {
        return this.state.passwordFieldReady;
    }

    get passwordEntered(): boolean {
        return this.state.passwordEntered;
    }

    setEmailVerified(value: boolean): void {
        this.state.emailVerified = value;
    }

    setPasswordFieldReady(value: boolean): void {
        this.state.passwordFieldReady = value;
    }

    setPasswordEntered(value: boolean): void {
        this.state.passwordEntered = value;
    }

    reset(): void {
        this.state = {
            emailVerified: false,
            passwordFieldReady: false,
            passwordEntered: false
        };
    }
}

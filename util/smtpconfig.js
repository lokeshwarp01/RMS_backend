export function getSMTPConfig(provider, email, appPassword) {
    if (!provider || !email || !appPassword) {
        throw new Error("Provider, email and app password must be provided.");
    }

    const p = provider.toLowerCase();

    if (p === "gmail") {
        return {
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: email.trim(),
                pass: appPassword.trim(),
            },
        };
    }

    if (p === "zoho") {
        return {
            host: "smtp.zoho.com",
            port: 465,
            secure: true,
            auth: {
                user: email.trim(),
                pass: appPassword.trim(),
            },
        };
    }

    if (p === "outlook") {
        return {
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: {
                user: email.trim(),
                pass: appPassword.trim(),
            },
        };
    }

    if (p === "yahoo") {
        return {
            host: "smtp.mail.yahoo.com",
            port: 465,
            secure: true,
            auth: {
                user: email.trim(),
                pass: appPassword.trim(),
            },
        };
    }

    throw new Error("Unsupported provider. Supported: gmail, zoho, outlook, yahoo");
}

export function getSMTPConfig(provider, email, appPassword) {
    if (!provider || !email || !appPassword) {
        throw new Error("Provider, email and app password must be provided.");
    }

    const p = provider.toLowerCase();

    if (p === "gmail") {
        // Gmail SMTP (explicit host/port helps in restricted/cloud networks)
        return {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: email, pass: appPassword },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            tls: { rejectUnauthorized: false }
        };
    }

    if (p === "zoho") {
        // Zoho SMTP
        return {
            host: "smtp.zoho.com",
            port: 465,
            secure: true,
            auth: { user: email, pass: appPassword }
        };
    }

    if (p === "outlook") {
        // Office365 / Outlook
        return {
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: { user: email, pass: appPassword }
        };
    }

    if (p === "yahoo") {
        return { service: "yahoo", auth: { user: email, pass: appPassword } };
    }

    throw new Error("Unsupported provider. Supported: gmail, zoho, outlook, yahoo");
}

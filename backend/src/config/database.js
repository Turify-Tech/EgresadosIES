import { createClient } from "@libsql/client";

class Database {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            // Validar variables de entorno requeridas para Turso
            if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
                throw new Error(
                    "DATABASE_URL y DATABASE_AUTH_TOKEN son requeridos para Turso"
                );
            }

            // Configuración únicamente para Turso
            const config = {
                url: process.env.DATABASE_URL,
                authToken: process.env.DATABASE_AUTH_TOKEN,
            };

            this.client = createClient(config);

            // Activar claves foráneas
            await this.client.execute("PRAGMA foreign_keys = ON");

            this.isConnected = true;
            console.log("☁️ Conectado a Turso exitosamente");

            return this.client;
        } catch (error) {
            console.error("❌ Error conectando a Turso:", error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log("🔌 Base de datos desconectada");
        }
    }

    getClient() {
        if (!this.isConnected || !this.client) {
            throw new Error("Base de datos no está conectada");
        }
        return this.client;
    }

    async healthCheck() {
        try {
            const result = await this.client.execute("SELECT 1 as test");
            return result.rows.length > 0;
        } catch (error) {
            console.error("❌ Health check de BD falló:", error);
            return false;
        }
    }
}

// Instancia singleton
const database = new Database();

export default database;

import db from "../src/config/database.js";
import "dotenv/config";

console.log("🧹 Limpiando imágenes con URLs de filesystem local...\n");

async function cleanup() {
  try {
    // Conectar a la base de datos
    await db.connect();
    const client = db.getClient();

    // Buscar todas las imágenes con URLs del filesystem local
    const imagenesViejas = await client.execute(
      `
    SELECT id, url, publicacionId 
    FROM ImagenPublicacion 
    WHERE url LIKE '/uploads/%'
  `
    );

    if (imagenesViejas.rows.length === 0) {
      console.log("✅ No hay imágenes antiguas para limpiar");
      process.exit(0);
    }

    console.log(
      `📋 Encontradas ${imagenesViejas.rows.length} imágenes antiguas:\n`
    );
    imagenesViejas.rows.forEach((img) => {
      console.log(`  - ID: ${img.id} | Publicación: ${img.publicacionId}`);
      console.log(`    URL: ${img.url}\n`);
    });

    // Eliminar las imágenes
    const deleteResult = await client.execute(
      `
    DELETE FROM ImagenPublicacion 
    WHERE url LIKE '/uploads/%'
  `
    );

    console.log(
      `✅ ${deleteResult.rowsAffected} imágenes eliminadas de la base de datos\n`
    );

    // Verificar si hay publicaciones sin imágenes ahora
    const publicacionesSinImagenes = await client.execute(
      `
    SELECT p.id, p.contenido, p.fechaCreacion
    FROM Publicacion p
    LEFT JOIN ImagenPublicacion i ON p.id = i.publicacionId
    WHERE i.id IS NULL
  `
    );

    if (publicacionesSinImagenes.rows.length > 0) {
      console.log(
        `ℹ️  ${publicacionesSinImagenes.rows.length} publicaciones quedaron sin imágenes`
      );
      console.log("   (esto es normal si tenían solo imágenes locales)\n");
    }

    console.log("✅ Limpieza completada exitosamente");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error.message);
    process.exit(1);
  }
}

cleanup();

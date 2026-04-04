# OpenSpec: Proposal (Full System)
> **Última actualización:** 2026-03-30 | Versión: 2.1.0

## 🎯 Visión & Propósito
**Agenmatica** es una plataforma de gestión de identidad digital potenciada por IA, diseñada para artistas, músicos, sellos, managers y agencias. Su propósito es transformar el caos de la presencia en múltiples redes sociales en un flujo de trabajo agencial coherente, donde la IA aprende continuamente del **ADN de cada ecosistema** para generar contenido auténtico, analizar tendencias y optimizar el engagement.

## 💡 El Problema
Los creativos y marcas enfrentan tres desafíos críticos:
1. **Inconsistencia de Voz**: Mantener un tono coherente a lo largo del tiempo y en múltiples plataformas es imposible manualmente.
2. **Fatiga de Contenido**: El agotamiento creativo de generar contenido diario relevante para 4-6 redes simultáneas.
3. **Fragmentación Operativa**: Gestionar múltiples identidades (artista principal, proyecto paralelo, sello propio) desde plataformas distintas y desconectadas entre sí.

## ✨ La Solución

### Multi-Proyecto ("Mis Ecosistemas")
Un **Workspace Central** donde cada identidad es un "Ecosistema" independiente con su propio ADN, redes conectadas, y motor de aprendizaje. El usuario puede crear y alternar entre múltiples ecosistemas desde una sola plataforma.

### Motor de ADN Semántico
Cada ecosistema codifica su identidad a través de:
- **Tono de Voz** (hasta 3 etiquetas, ej. Sarcástico, Visceral)
- **Valores Core** (hasta 3 etiquetas, ej. Autenticidad, DIY)
- **Géneros** (hasta 10)
- **Perfil Vectorial** (`pgvector`) que evoluciona con cada feedback

### Signal Chain (Redes Conectadas)
Las redes sociales de cada ecosistema (Instagram, TikTok, Twitter, Spotify, Facebook, LinkedIn) se conectan vía OAuth 2.0. El sistema puede escanear el historial de contenido para alimentar el motor de aprendizaje. La desconexión ejecuta un **Hard-Reset** completo para garantizar la pureza del ADN.

### Post Lab (Laboratorio de Contenido)
La IA genera drafts de posts. El usuario actúa como **Director Creativo**: aprueba, edita o rechaza con feedback semántico. Cada acción entrena el vector de identidad del ecosistema.

## 🚀 Valor del Negocio
- **Reducción del 80%** en tiempo de gestión de redes sociales.
- **Escalabilidad Multi-Identidad**: Una sola plataforma para gestionar artista + sello + manager.
- **Curva de Aprendizaje**: A mayor uso, la IA se vuelve semánticamente indistinguible de la marca real.
- **Centralización**: Un solo cerebro para 6 plataformas simultáneas.

## 🎨 Diseño: "The Electric Circuitry of Chaos"
La plataforma usa un sistema de diseño propio de estética **Neon Grunge / Obsidian** con paleta de colores `#0e0e0f` (negro obsidiana), `#cc97ff` (electric purple), `#6bff8f` (toxic green). Tipografía: Epilogue (display), Inter (body), Space Grotesk (mono). Ver `DESIGN.md` para la especificación completa.

## 💻 Mandato de Infraestructura (Docker-First)
Para garantizar la estabilidad del sistema, la portabilidad entre arquitecturas y la paridad de entornos:
- **Ejecución obligatoria en Docker**: Todo el ecosistema de Agenmatica (Backend, Frontend, Workers, Redis, RabbitMQ, PostgreSQL con pgvector) debe ejecutarse y desarrollarse exclusivamente a través de contenedores gestionados por `docker-compose`.
- **Despliegue**: No se permite la instalación manual de dependencias locales de base de datos o servicios. Cualquier cambio en la arquitectura debe reflejarse en el `docker-compose.yml` y el `Dockerfile`.
- **Pruebas**: Los tests unitarios y de integración deben ejecutarse dentro de los contenedores para asegurar que el entorno de testing coincida exactamente con el de ejecución.

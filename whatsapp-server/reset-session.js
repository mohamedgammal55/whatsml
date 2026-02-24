const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sessionId = '81e67f06-bade-4ed7-9f33-1203b9fda208';

async function main() {
    console.log(`Starting cleanup for session: ${sessionId}`);

    try {
        const sessions = await prisma.session.findMany({
            where: { sessionId: sessionId }
        });
        console.log(`Found ${sessions.length} records in session table for this sessionId.`);
        console.log(JSON.stringify(sessions, null, 2));

        if (sessions.length > 0) {
            const deleteSession = await prisma.session.deleteMany({
                where: { sessionId: sessionId },
            });
            console.log(`Deleted ${deleteSession.count} records from session table`);
        }

        const deleteChat = await prisma.chat.deleteMany({
            where: { sessionId: sessionId },
        });
        console.log(`Deleted ${deleteChat.count} records from chat table`);

        const deleteContact = await prisma.contact.deleteMany({
            where: { sessionId: sessionId },
        });
        console.log(`Deleted ${deleteContact.count} records from contact table`);

        const deleteGroupMeta = await prisma.groupMetadata.deleteMany({
            where: { sessionId: sessionId },
        });
        console.log(`Deleted ${deleteGroupMeta.count} records from groupMetadata table`);

        const deleteMessage = await prisma.message.deleteMany({
            where: { sessionId: sessionId },
        });
        console.log(`Deleted ${deleteMessage.count} records from message table`);

        console.log('Session cleanup completed successfully.');
    } catch (error) {
        console.error('Error during session cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

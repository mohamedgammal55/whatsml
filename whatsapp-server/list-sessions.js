const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Listing all sessions:');
    try {
        const sessions = await prisma.session.findMany({
            select: { sessionId: true, id: true },
            distinct: ['sessionId']
        });
        console.log(JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error('Error listing sessions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

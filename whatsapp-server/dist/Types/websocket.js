"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListEvents = exports.WebhookEventsEnum = exports.WebhookEvents = void 0;
class WebhookEvents {
}
exports.WebhookEvents = WebhookEvents;
exports.WebhookEventsEnum = {
    qrcodeUpdated: "qrcode.updated",
    messagesHistorySet: "messaging-history.set",
    messagesUpsert: "messages.upsert",
    messagesUpdated: "messages.update",
    messagesDelete: "messages.delete",
    messageReceiptUpdated: "message-receipt.update",
    messagesReaction: "messages.reaction",
    sendMessage: "send.message",
    contactsSet: "contacts.set",
    contactsUpsert: "contacts.upsert",
    contactsUpdated: "contacts.update",
    chatsSet: "chats.set",
    chatsUpsert: "chats.upsert",
    chatsUpdated: "chats.update",
    chatsDeleted: "chats.delete",
    presenceUpdated: "presence.update",
    groupsUpsert: "groups.upsert",
    groupsUpdated: "groups.update",
    groupsParticipantsUpdated: "group-participants.update",
    connectionUpdated: "connection.update",
    callUpsert: "call.upsert",
};
exports.ListEvents = Object.values(exports.WebhookEventsEnum);

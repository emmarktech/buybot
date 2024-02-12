import { Telegraf } from "telegraf"

const token = '6946830740:AAESUww3GYi_hEWXtO6WYhLCgK_DnU5_J2g'

const bot = new Telegraf(token)
bot.catch(err => {
})

async function ifAdmin(ctx) {
    if (ctx.message?.from?.username === 'GroupAnonymousBot' || ctx.callbackQuery?.from?.username === 'GroupAnonymousBot') {
        return true
    }
    try {
        return await ctx.getChatMember(ctx.callbackQuery.from.id).then(data => data.status === 'creator' || data.status === 'administrator')
    } catch {
        return await ctx.getChatMember(ctx.message.from.id).then(data => data.status === 'creator' || data.status === 'administrator')
    }
}

function getMenuMessageId(ctx) {
    return ctx.message.reply_to_message.entities[0].url.slice(8, -5)
}

function getHiddenData(message, position) {
    return message.entities[position].url.slice(8, -5)
}

async function deleteMessage(chatid, messageid) {
    try {
        await bot.telegram.deleteMessage(chatid, messageid)
    } catch { }
}

export { getHiddenData, ifAdmin, getMenuMessageId, deleteMessage }
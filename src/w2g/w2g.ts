import { CommandInteraction, MessageEmbed } from "discord.js";
import fetch from 'node-fetch';

import { w2g_api_key } from "../w2g/config.json";
var w2g_rooms = [];


    export async function w2g(interaction: CommandInteraction, url: string) {

        if (url) {
            if (url == 'rooms') {
                var room_fields = []
                for (let i = 0; i < w2g_rooms.length; i++) {
                    let room_nr = (i) + 1
                    room_fields.push({ name: `Room ${room_nr} Created by ${w2g_rooms[i].creator}`, value: `[Watch2Gether](${w2g_rooms[i].url})` })
                }
                if (room_fields.length == 0 ) {room_fields.push({ name: 'No rooms', value: 'There are no w2g-rooms available!' })}
                const w2gRooms = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Current Watch2Gether Rooms:')
                    .addFields(
                        room_fields
                    )
                    .setThumbnail('https://w2g.tv/static/watch2gether-share.jpg')
                    .setFooter(`Requested by ${interaction.user.username}`, interaction.user.avatarURL())
                    .setTimestamp(interaction.createdTimestamp);
                return interaction.reply({embeds: [w2gRooms]});
            } else {
                const  response = await fetch("https://w2g.tv/rooms/create.json", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "w2g_api_key": w2g_api_key,
                        "share": url,
                        "bg_color": "#000000",
                        "bg_opacity": "80"
                    })
                });
                const data = await response.json();
                if (data) {
                    let w2g_room = {
                        creator: interaction.member.user.username,
                        url: `https://w2g.tv/rooms/${data.streamkey}`,
                        created_at: data.created_at
                    };
                    
                    w2g_rooms.push(w2g_room);
                    return interaction.reply(w2g_room.url);
                    //console.log("W2G: Here is your room! \n https://w2g.tv/rooms/" + data.streamkey);
                }
            }
        } else {
            let url = '';
            const  response = await fetch("https://w2g.tv/rooms/create.json", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "w2g_api_key": w2g_api_key,
                        "share": url,
                        "bg_color": "#000000",
                        "bg_opacity": "80"
                    })
                });
            const data = await response.json();
            if (data) {
                let w2g_room = {
                    creator: interaction.member.user.username,
                    url: `https://w2g.tv/rooms/${data.streamkey}`,
                    created_at: data.created_at
                };
                
                w2g_rooms.push(w2g_room);
                return interaction.reply(w2g_room.url);
                //console.log("W2G: Here is your room! \n https://w2g.tv/rooms/" + data.streamkey);
            }
        }
    }
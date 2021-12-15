"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.w2g = void 0;
var discord_js_1 = require("discord.js");
var node_fetch_1 = __importDefault(require("node-fetch"));
var config_json_1 = require("../w2g/config.json");
var w2g_rooms = [];
function w2g(interaction, url) {
    return __awaiter(this, void 0, void 0, function () {
        var room_fields, i, room_nr, w2gRooms, response, data, w2g_room, url_1, response, data, w2g_room;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!url) return [3 /*break*/, 5];
                    if (!(url == 'rooms')) return [3 /*break*/, 1];
                    room_fields = [];
                    for (i = 0; i < w2g_rooms.length; i++) {
                        room_nr = (i) + 1;
                        room_fields.push({ name: "Room " + room_nr + " Created by " + w2g_rooms[i].creator, value: "[Watch2Gether](" + w2g_rooms[i].url + ")" });
                    }
                    if (room_fields.length == 0) {
                        room_fields.push({ name: 'No rooms', value: 'There are no w2g-rooms available!' });
                    }
                    w2gRooms = new discord_js_1.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Current Watch2Gether Rooms:')
                        .addFields(room_fields)
                        .setThumbnail('https://w2g.tv/static/watch2gether-share.jpg')
                        .setFooter("Requested by " + interaction.user.username, interaction.user.avatarURL())
                        .setTimestamp(interaction.createdTimestamp);
                    return [2 /*return*/, interaction.reply({ embeds: [w2gRooms] })];
                case 1: return [4 /*yield*/, node_fetch_1["default"]("https://w2g.tv/rooms/create.json", {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "w2g_api_key": config_json_1.w2g_api_key,
                            "share": url,
                            "bg_color": "#000000",
                            "bg_opacity": "80"
                        })
                    })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (data) {
                        w2g_room = {
                            creator: interaction.member.user.username,
                            url: "https://w2g.tv/rooms/" + data.streamkey,
                            created_at: data.created_at
                        };
                        w2g_rooms.push(w2g_room);
                        return [2 /*return*/, interaction.reply(w2g_room.url)];
                        //console.log("W2G: Here is your room! \n https://w2g.tv/rooms/" + data.streamkey);
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 8];
                case 5:
                    url_1 = '';
                    return [4 /*yield*/, node_fetch_1["default"]("https://w2g.tv/rooms/create.json", {
                            method: 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "w2g_api_key": config_json_1.w2g_api_key,
                                "share": url_1,
                                "bg_color": "#000000",
                                "bg_opacity": "80"
                            })
                        })];
                case 6:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 7:
                    data = _a.sent();
                    if (data) {
                        w2g_room = {
                            creator: interaction.member.user.username,
                            url: "https://w2g.tv/rooms/" + data.streamkey,
                            created_at: data.created_at
                        };
                        w2g_rooms.push(w2g_room);
                        return [2 /*return*/, interaction.reply(w2g_room.url)];
                        //console.log("W2G: Here is your room! \n https://w2g.tv/rooms/" + data.streamkey);
                    }
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.w2g = w2g;

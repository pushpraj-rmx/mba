"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const templates_1 = __importDefault(require("./templates"));
// import whatsappRouter from "./whatsapp"; // future services
const router = (0, express_1.Router)();
router.use(templates_1.default);
// router.use(whatsappRouter);
exports.default = router;

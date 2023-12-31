import express from 'express';
import {TestController} from "../Controllers/TestController.js";

const router = express.Router();

const testController = new TestController();

// Определение маршрутов и их обработка
router.get('/', testController.sayHello);
// router.get('/:id', userController.getUserById);
// router.post('/', userController.createUser);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

export {router};
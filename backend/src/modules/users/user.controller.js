'use strict';

const userService = require('./user.service');
const fileService = require('../core/file.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');
const { getFileUrl } = require('../../shared/helpers/file.helper');

class UserController {
  create = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.user.id);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.success(user, 'User created successfully'));
  });

  getAll = asyncHandler(async (req, res) => {
    const { users, meta } = await userService.getAllUsers(req.query);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.paginated(users, MESSAGES.USERS_FETCHED, meta),
    );
  });

  getById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(user, MESSAGES.USER_FETCHED));
  });

  update = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(user, MESSAGES.USER_UPDATED));
  });

  delete = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.USER_DELETED));
  });

  uploadAvatar = asyncHandler(async (req, res) => {
    const filename = await fileService.saveImage(req.file, 'avatars');
    const user = await userService.uploadAvatar(req.user.id, filename);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(MESSAGES.FILE_UPLOADED, {
        avatar: getFileUrl(filename, 'avatars'),
        user,
      }),
    );
  });
}

module.exports = new UserController();

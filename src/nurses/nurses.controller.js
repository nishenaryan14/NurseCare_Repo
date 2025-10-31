"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NursesController = void 0;
// src/nurses/nurses.controller.ts
const common_1 = require("@nestjs/common");
const nurses_service_1 = require("./nurses.service");
const create_nurse_dto_1 = require("./dto/create-nurse.dto");
const update_nurse_dto_1 = require("./dto/update-nurse.dto");
const jwt_guard_1 = require("../common/guards/jwt.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const role_enum_1 = require("../common/enums/role.enum");
let NursesController = class NursesController {
    constructor(nurses) {
        this.nurses = nurses;
    }
    // Nurse creates profile
    create(req, dto) {
        return this.nurses.create(req.user.userId, dto);
    }
    // Nurse fetches own profile
    findMe(req) {
        return this.nurses.findByUserId(req.user.userId);
    }
    // Nurse updates profile
    update(req, dto) {
        console.log('Raw body:', req.body);
        console.log('DTO after validation:', dto);
        return this.nurses.update(req.user.userId, dto);
    }
    // Nurse deletes profile
    remove(req) {
        return this.nurses.remove(req.user.userId);
    }
    // Patients fetch approved nurses with optional filters (specialization,location,hourlyRate)
    getApproved(specialization, location, maxRate) {
        return this.nurses.getApprovedNurses({
            specialization,
            location,
            maxRate: maxRate ? Number(maxRate) : undefined,
        });
    }
    // Admin fetches all pending nurse profiles
    getPending() {
        return this.nurses.getPendingProfiles();
    }
    // Public fetch nurse availability by profile id
    getAvailability(id) {
        return this.nurses.findAvailabilityById(Number(id));
    }
    // Nurse updates availability
    updateAvailability(req, availability) {
        return this.nurses.updateAvailability(req.user.userId, availability);
    }
    // Admin approves nurse
    approve(id) {
        return this.nurses.approveNurse(Number(id));
    }
    // Admin rejects nurse profile
    reject(id) {
        return this.nurses.rejectNurse(Number(id));
    }
};
exports.NursesController = NursesController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_nurse_dto_1.CreateNurseDto]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "findMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_nurse_dto_1.UpdateNurseDto]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('approved'),
    __param(0, (0, common_1.Query)('specialization')),
    __param(1, (0, common_1.Query)('location')),
    __param(2, (0, common_1.Query)('maxRate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "getApproved", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)('availability/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('availability'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('availability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.Delete)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NursesController.prototype, "reject", null);
exports.NursesController = NursesController = __decorate([
    (0, common_1.Controller)('nurses'),
    __metadata("design:paramtypes", [nurses_service_1.NursesService])
], NursesController);

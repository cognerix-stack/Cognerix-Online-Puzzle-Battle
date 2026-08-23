import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PuzzleType } from '@puzzle-verse/shared';

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.userId);
  }

  @Post('status')
  async updateStatus(@Request() req: any, @Body('status') status: string) {
    return this.profileService.updateStatus(req.user.userId, status);
  }

  @Post('win')
  async recordGameWin(
    @Request() req: any,
    @Body('puzzleType') puzzleType: PuzzleType,
    @Body('time') time: number,
    @Body('score') score: number,
    @Body('rank') rank?: string,
    @Body('avatar') avatar?: string,
    @Body('frame') frame?: string,
    @Body('nameColor') nameColor?: string,
    @Body('badges') badges?: string,
  ) {
    return this.profileService.recordGameWin(
      req.user.userId,
      puzzleType,
      time,
      score,
      req.user.username,
      nameColor,
      badges,
      rank,
      avatar,
      frame
    );
  }

  @Post('avatar-frame')
  async updateAvatarAndFrame(
    @Request() req: any,
    @Body('avatar') avatar: string,
    @Body('frame') frame: string,
  ) {
    return this.profileService.updateAvatarAndFrame(req.user.userId, avatar, frame);
  }

  @Post('buy')
  async buyStoreItem(
    @Request() req: any,
    @Body('itemId') itemId: string,
    @Body('costCoins') costCoins: number,
    @Body('costGems') costGems: number,
  ) {
    return this.profileService.buyStoreItem(req.user.userId, itemId, costCoins, costGems);
  }

  @Post('equip')
  async equipCosmetic(
    @Request() req: any,
    @Body('itemId') itemId: string,
    @Body('type') type: 'NAME_COLOR' | 'BADGE' | 'LOBBY_ANIMATION',
    @Body('value') value: string,
  ) {
    return this.profileService.equipCosmetic(req.user.userId, itemId, type, value);
  }

  @Post('sync')
  async syncProfile(@Body() profile: any, @Request() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    console.log(`[API POST /profile/sync] user: ${profile?.username} (${profile?.id}), IP: ${ip}`);
    return this.profileService.syncProfile({
      ...profile,
      ipAddress: ip
    });
  }

  @Post('load-or-create')
  async loadOrCreateProfile(
    @Body('userId') userId: string,
    @Body('username') username: string,
    @Body('email') email: string,
  ) {
    console.log(`[API POST /profile/load-or-create] Request for userId: ${userId}, username: ${username}, email: ${email}`);
    return this.profileService.loadOrCreateProfile(userId, username, email);
  }

  @Post('delete')
  async deleteProfile(@Body('userId') userId: string) {
    console.log(`[API POST /profile/delete] Request to delete userId: ${userId}`);
    return this.profileService.deleteProfile(userId);
  }

  @Get('history')
  async getGameHistory(@Query('userId') userId: string) {
    console.log(`[API GET /profile/history] Request history for userId: ${userId}`);
    return this.profileService.getGameHistory(userId);
  }

  @Get('users')
  @UseGuards(AdminGuard)
  async getAllUsers() {
    return this.profileService.getAllUsers();
  }

  @Get('friends')
  async getFriends(@Request() req: any) {
    console.log(`[API GET /profile/friends] userId: ${req.user.userId}`);
    return this.profileService.getFriends(req.user.userId);
  }

  @Get('friends/admin')
  @UseGuards(AdminGuard)
  async getFriendsAdmin(@Query('userId') userId: string) {
    console.log(`[API GET /profile/friends/admin] userId: ${userId}`);
    return this.profileService.getFriends(userId);
  }

  @Post('friends/add')
  async addFriend(@Request() req: any, @Body('friendUsername') friendUsername: string) {
    console.log(`[API POST /profile/friends/add] userId: ${req.user.userId}, friendUsername: ${friendUsername}`);
    return this.profileService.addFriend(req.user.userId, friendUsername);
  }

  @Post('friends/remove')
  async removeFriend(@Request() req: any, @Body('friendId') friendId: string) {
    console.log(`[API POST /profile/friends/remove] userId: ${req.user.userId}, friendId: ${friendId}`);
    return this.profileService.removeFriend(req.user.userId, friendId);
  }

  @Post('friends/request')
  async sendFriendRequest(
    @Request() req: any,
    @Body('friendUsername') friendUsername?: string,
    @Body('friendId') friendId?: string
  ) {
    console.log(`[API POST /profile/friends/request] userId: ${req.user.userId}, friendUsername: ${friendUsername}, friendId: ${friendId}`);
    return this.profileService.sendFriendRequest(req.user.userId, friendUsername, friendId);
  }

  @Get('friends/requests')
  async getFriendRequests(@Request() req: any) {
    console.log(`[API GET /profile/friends/requests] userId: ${req.user.userId}`);
    return this.profileService.getFriendRequests(req.user.userId);
  }

  @Post('friends/request/accept')
  async acceptFriendRequest(
    @Request() req: any,
    @Body('senderId') senderId: string
  ) {
    console.log(`[API POST /profile/friends/request/accept] userId: ${req.user.userId}, senderId: ${senderId}`);
    return this.profileService.acceptFriendRequest(req.user.userId, senderId);
  }

  @Post('friends/request/decline')
  async declineFriendRequest(
    @Request() req: any,
    @Body('senderId') senderId: string
  ) {
    console.log(`[API POST /profile/friends/request/decline] userId: ${req.user.userId}, senderId: ${senderId}`);
    return this.profileService.declineFriendRequest(req.user.userId, senderId);
  }

  @Post('friends/block')
  async blockChallenger(
    @Request() req: any, 
    @Body('challengerId') challengerId: string,
    @Body('durationSec') durationSec: number
  ) {
    console.log(`[API POST /profile/friends/block] userId: ${req.user.userId}, challengerId: ${challengerId}, duration: ${durationSec}s`);
    return this.profileService.blockChallenger(req.user.userId, challengerId, durationSec);
  }

  @Get('friends/check-block')
  async checkBlock(
    @Request() req: any,
    @Query('targetId') targetId: string
  ) {
    console.log(`[API GET /profile/friends/check-block] targetId: ${targetId}, challengerId: ${req.user.userId}`);
    return this.profileService.checkBlock(targetId, req.user.userId);
  }

  @Post('friends/challenge')
  async createChallenge(
    @Request() req: any,
    @Body('targetId') targetId: string,
    @Body('puzzleType') puzzleType: string,
    @Body('pin') pin: string
  ) {
    console.log(`[API POST /profile/friends/challenge] senderId: ${req.user.userId}, targetId: ${targetId}, puzzleType: ${puzzleType}, pin: ${pin}`);
    return this.profileService.createChallenge(req.user.userId, targetId, puzzleType, pin);
  }

  @Get('friends/challenges')
  async getChallenges(@Request() req: any) {
    console.log(`[API GET /profile/friends/challenges] userId: ${req.user.userId}`);
    return this.profileService.getChallenges(req.user.userId);
  }

  @Post('friends/challenge/clear')
  async clearChallenge(
    @Request() req: any,
    @Body('senderId') senderId: string
  ) {
    console.log(`[API POST /profile/friends/challenge/clear] receiverId: ${req.user.userId}, senderId: ${senderId}`);
    return this.profileService.clearChallenge(req.user.userId, senderId);
  }

  @Post('friends/challenge/decline')
  async declineChallenge(
    @Request() req: any,
    @Body('senderId') senderId: string
  ) {
    console.log(`[API POST /profile/friends/challenge/decline] receiverId: ${req.user.userId}, senderId: ${senderId}`);
    return this.profileService.declineChallenge(req.user.userId, senderId);
  }

  @Get('friends/challenge/status')
  async getChallengeStatus(
    @Request() req: any,
    @Query('pin') pin: string
  ) {
    console.log(`[API GET /profile/friends/challenge/status] senderId: ${req.user.userId}, pin: ${pin}`);
    return this.profileService.getChallengeStatus(req.user.userId, pin);
  }

  @Post('friends/chat/send')
  async sendChatMessage(
    @Request() req: any,
    @Body('friendId') friendId: string,
    @Body('text') text: string
  ) {
    console.log(`[API POST /profile/friends/chat/send] senderId: ${req.user.userId}, friendId: ${friendId}, text: ${text}`);
    return this.profileService.sendChatMessage(req.user.userId, friendId, text);
  }

  @Get('friends/chat')
  async getChatHistory(
    @Request() req: any,
    @Query('friendId') friendId: string
  ) {
    console.log(`[API GET /profile/friends/chat] userId: ${req.user.userId}, friendId: ${friendId}`);
    return this.profileService.getChatHistory(req.user.userId, friendId);
  }

  @Post('friends/chat/clear')
  async clearChatHistory(
    @Request() req: any,
    @Body('friendId') friendId: string
  ) {
    console.log(`[API POST /profile/friends/chat/clear] userId: ${req.user.userId}, friendId: ${friendId}`);
    return this.profileService.clearChatHistory(req.user.userId, friendId);
  }

  @Get('mailbox')
  async getMailbox(@Request() req: any) {
    return this.profileService.getMailbox(req.user.userId);
  }

  @Post('mailbox/send')
  @UseGuards(AdminGuard)
  async sendMail(
    @Request() req: any,
    @Body('targetId') targetId?: string,
    @Body('mailType') mailType?: 'announcement' | 'gift',
    @Body('title') title?: string,
    @Body('content') content?: string,
    @Body('rewardCoins') rewardCoins?: number,
    @Body('rewardGems') rewardGems?: number,
  ) {
    return this.profileService.sendMail(
      req.user.userId,
      targetId || undefined,
      mailType || 'announcement',
      title || '',
      content || '',
      rewardCoins,
      rewardGems
    );
  }

  @Post('mailbox/claim')
  async updateMailClaimed(
    @Request() req: any,
    @Body('mailId') mailId: string
  ) {
    return this.profileService.updateMailClaimed(req.user.userId, mailId);
  }

  // --- MODERATION ENDPOINTS ---
  @Post('ban')
  @UseGuards(AdminGuard)
  async banUser(
    @Body('profileId') profileId: string,
    @Body('reason') reason?: string
  ) {
    return this.profileService.banUser(profileId, reason);
  }

  @Post('unban')
  @UseGuards(AdminGuard)
  async unbanUser(@Body('profileId') profileId: string) {
    return this.profileService.unbanUser(profileId);
  }

  @Get('banned')
  async getBannedPlayers() {
    return this.profileService.getBannedPlayers();
  }

  @Post('report')
  async submitReport(
    @Body('reportingProfileId') reportingProfileId: string,
    @Body('opponentProfileId') opponentProfileId: string,
    @Body('opponentNickname') opponentNickname: string,
    @Body('nickname') nickname: string,
    @Body('reason') reason: string,
    @Body('description') description?: string,
    @Body('sessionId') sessionId?: string,
    @Body('puzzleType') puzzleType?: string,
  ) {
    return this.profileService.submitReport({
      reportingProfileId,
      opponentProfileId,
      opponentNickname,
      nickname,
      reason,
      description,
      sessionId,
      puzzleType,
    });
  }

  @Post('support')
  async submitSupport(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('userId') userId: string,
    @Body('subject') subject: string,
    @Body('description') description: string,
  ) {
    return this.profileService.submitSupport({
      name,
      email,
      userId,
      subject,
      description
    });
  }

  @Post('popup-announcements')
  @UseGuards(AdminGuard)
  async createPopupAnnouncement(
    @Body('text') text: string,
    @Body('targetUserIds') targetUserIds?: string
  ) {
    console.log(`[API POST /profile/popup-announcements] text: ${text}, targets: ${targetUserIds}`);
    return this.profileService.createPopupAnnouncement(text, targetUserIds);
  }

  @Get('popup-announcements')
  async getPopupAnnouncements(@Request() req: any) {
    console.log(`[API GET /profile/popup-announcements] userId: ${req.user.userId}`);
    return this.profileService.getPopupAnnouncements(req.user.userId);
  }

  @Get('popup-announcements/all')
  @UseGuards(AdminGuard)
  async getAllPopupAnnouncements() {
    console.log(`[API GET /profile/popup-announcements/all] Admin fetching all announcements`);
    return this.profileService.getAllPopupAnnouncements();
  }

  @Delete('popup-announcements/:id')
  @UseGuards(AdminGuard)
  async deletePopupAnnouncement(@Param('id') id: string) {
    console.log(`[API DELETE /profile/popup-announcements/${id}]`);
    return this.profileService.deletePopupAnnouncement(id);
  }

  @Get('admin/chat-history')
  @UseGuards(AdminGuard)
  async getAdminGameChatHistory(@Query('userId') userId: string) {
    return this.profileService.getChatHistoryForUser(userId);
  }

  @Get('admin/room-lookup')
  @UseGuards(AdminGuard)
  async getAdminRoomLookup(@Query('roomId') roomId: string) {
    return this.profileService.getRoomLookup(roomId);
  }

  @Get('admin/reports')
  @UseGuards(AdminGuard)
  async getAdminReports() {
    return this.profileService.getAdminReports();
  }

  @Delete('admin/reports/:id')
  @UseGuards(AdminGuard)
  async deleteAdminReport(@Param('id') id: string) {
    return this.profileService.deleteReport(id);
  }

  @Get('matchmaking/queues')
  async getMatchmakingQueues() {
    const { GameRoom } = require('../multiplayer/rooms/GameRoom');
    return GameRoom.getQueueCounts();
  }
}

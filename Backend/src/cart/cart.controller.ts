import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartItemDto, UpdateCartItemDto, ValidateCartDto } from './dto';
import { Public } from '@/auth/decorators/public.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { RequestUser } from '@/auth/interfaces/request-user.interface';
import type { ProductSize } from '@/products/schemas/product-size-stock.schema';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Public()
  @Post('validate')
  @ApiOperation({
    summary: 'Re-price and validate an arbitrary set of cart lines (works for guests too)',
  })
  async validate(@Body() dto: ValidateCartDto) {
    return this.cartService.validate(dto.items);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get the current user's server-synced cart, re-priced against live product data",
  })
  async getCart(@CurrentUser() user: RequestUser) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a menu item to the cart (identical customizations merge)' })
  async addItem(@CurrentUser() user: RequestUser, @Body() dto: CartItemDto) {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:lineKey')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a customized menu line to an exact quantity (0 removes it)' })
  async updateLine(
    @CurrentUser() user: RequestUser,
    @Param('lineKey') lineKey: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateLine(user.userId, lineKey, dto.quantity);
  }

  @Delete('items/:lineKey')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a customized menu line from the cart' })
  async removeLine(@CurrentUser() user: RequestUser, @Param('lineKey') lineKey: string) {
    return this.cartService.updateLine(user.userId, lineKey, 0);
  }

  @Patch('items/:productId/:size')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set an item to an exact quantity (0 removes it)' })
  async updateItem(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
    @Param('size') size: ProductSize,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateItem(user.userId, productId, size, dto.quantity);
  }

  @Delete('items/:productId/:size')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an item from the cart' })
  async removeItem(
    @CurrentUser() user: RequestUser,
    @Param('productId') productId: string,
    @Param('size') size: ProductSize
  ) {
    return this.cartService.removeItem(user.userId, productId, size);
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear the entire cart' })
  async clear(@CurrentUser() user: RequestUser) {
    return this.cartService.clear(user.userId);
  }
}

import { Controller, Get, Param, Query } from "@nestjs/common";
import { Locale } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("blog")
export class BlogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("locale") locale: Locale = "fa") {
    return this.prisma.blogPost.findMany({
      where: { published: true },
      include: { translations: { where: { locale } } },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.prisma.blogPost.findUnique({
      where: { slug },
      include: { translations: true },
    });
  }
}

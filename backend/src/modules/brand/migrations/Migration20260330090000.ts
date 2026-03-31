import { Migration } from "@mikro-orm/migrations";

export class Migration20260330090000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "brand" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "brand_pkey" primary key ("id"));'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "brand" cascade;');
  }
}

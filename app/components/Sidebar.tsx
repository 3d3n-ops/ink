"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenTool, User } from "lucide-react";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ProfileDrawer } from "./ProfileDrawer";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/write", label: "Write", icon: PenTool },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <ShadcnSidebar collapsible="icon" className="border-r border-[#171717]/10">
        <SidebarHeader className="p-2">
          <div className="flex items-center gap-2 px-2">
            <h2 className="text-lg font-bold text-[#171717] group-data-[collapsible=icon]:hidden">
              ink
            </h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setProfileOpen(true)}
                    tooltip="Profile"
                  >
                    <User />
                    <span>Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ShadcnSidebar>
      <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

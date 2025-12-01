import { useState, useEffect, useMemo, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, EllipsisIcon, ShirtIcon, Grid3X3Icon, PlusIcon } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "react-i18next";
import type { Avatar, Item } from "@/lib/api";
import { AvatarAddDialog } from "@/components/features/avatars/AvatarAddDialog";
import { ItemAddDialog } from "@/components/features/items/ItemAddDialog";

const MAX_VISIBLE = 10;

export default function HomePage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [openNewAvatar, setOpenNewAvatar] = useState(false);
  const [openNewItem, setOpenNewItem] = useState(false);

  useEffect(() => {
    if (auth.user) {
      fetchAvatars();
      fetchItems();
    }
  }, [auth.user]);

  // 一覧取得
  const fetchAvatars = async () => {
    const res = await dashboardApi.avatars.$get({
      query: { 
        limit: MAX_VISIBLE+1,
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setAvatars(await res.json());
  };
  const fetchItems = async () => {
    const res = await dashboardApi.items.$get({
      query:{
        limit: '16',
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setItems(await res.json());
  };

  return (
    <PageLayout>
      <div className="gap-8 flex flex-col">
        {/* --- クイックアクセス --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="matrix">
            <Card className="hover:bg-vrclo1-50  transition-colors cursor-pointer h-full border-2 border-transparent hover:border-vrclo1-200 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-vrclo1-700">{t("dashboard.my_matrix")}</CardTitle>
                <Grid3X3Icon className="h-5 w-5 text-vrclo1-500" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-vrclo1-500">
                  {t("dashboard.matrix_description")}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* public outfits */}
          <Link to="/outfits"> 
            <Card className="bg-blue-50 hover:bg-blue-100  transition-colors cursor-pointer h-full border-2 border-transparent hover:border-blue-200 ">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-blue-700 ">{t("dashboard.community_outfit")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600/80 ">
                  {t("dashboard.community_outfit_description")}
                </p>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* --- 所持アバター --- */}
        <section>
          <MyAssetList
            t_mode="avatar"
            data={avatars}
            isDialogOpen={openNewAvatar}
            setIsDialogOpen={setOpenNewAvatar}
            onClickTitle={() => navigate("avatars")}
            onClickItem={(item) => navigate(`avatars/${item.id}`)}
            onSuccess={fetchAvatars}
          />
        </section>
        {/* --- 所持アイテム --- */}
        <section>
          <MyAssetList
            t_mode="item"
            data={items}
            isDialogOpen={openNewItem}
            setIsDialogOpen={setOpenNewItem}
            onClickTitle={() => navigate("items")}
            onClickItem={(item) => navigate(`items/${item.id}`)}
            onSuccess={fetchItems}
          />
        </section>
      </div>
    </PageLayout>
  );
}

const MyAssetList = <T extends Avatar | Item>(props:{
  t_mode?: 'avatar' | 'item'; 
  data: T[];
  isDialogOpen: boolean;
  maxVisible?: number
  setIsDialogOpen: (open: boolean) => void;
  onClickTitle: () => void;
  onClickItem: (item: T) => void;
  onSuccess?: () => void;
}) => {

  const { t } = useTranslation();

  const maxVisible = props.maxVisible ?? 10;

  const Icon = props.t_mode === 'item' ? ShirtIcon : UserIcon;
  const trans = {
    title: props.t_mode === 'item' ? t("dashboard.my_items") : t("dashboard.my_avatars"),
    addDialogTitle: props.t_mode === 'item' ? t("dashboard.add_item_dialog_title") : t("dashboard.add_avatar_dialog_title"),
    addDialogDescription: props.t_mode === 'item' ? t("dashboard.add_item_dialog_description") : t("dashboard.add_avatar_dialog_description"),
    emptyMessage: props.t_mode === 'item' ? t("dashboard.my_items_empty") : t("dashboard.my_avatars_empty"),

    nameField: props.t_mode === 'item' ? t("core.data.item.name") : t("core.data.avatar.name"),
    storeUrlField: props.t_mode === 'item' ? t("core.data.item.store_url") : t("core.data.avatar.store_url"),
    thumbnailUrlField: props.t_mode === 'item' ? t("core.data.item.thumbnail_url") : t("core.data.avatar.thumbnail_url"),
  }
  const DialogComponent = useMemo(() => 
    props.t_mode === 'item' ? ItemAddDialog : AvatarAddDialog,
  [props.t_mode]);

  return (
    <Card className="hover:bg-vrclo1-50  transition-colors h-full border-2 border-transparent hover:border-vrclo1-200 ">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle onClick={props.onClickTitle} className="text-lg text-vrclo1-700 font-bold flex items-center gap-2 cursor-pointer">
          <Icon className="h-5 w-5" /> 
          {trans.title}
        </CardTitle>

        <Button onClick={() => props.setIsDialogOpen(true)}><PlusIcon className="h-4 w-4 mr-2" /> {t('core.action.add')}</Button>
        <DialogComponent
          open={props.isDialogOpen} 
          setOpen={props.setIsDialogOpen} 
          onSuccess={props.onSuccess} 
        />

      </CardHeader>             

      {/* 横スクロール可能に */}
      <div className="flex gap-4 p-4 overflow-x-auto">
        {props.data.slice(0, maxVisible).map((item) => (
          <Card 
            key={item.id} onClick={() => props.onClickItem(item)} 
            className="min-w-[33%] w-[33%] md:min-w-[25%] md:w-[25%] lg:min-w-[20%] lg:w-[20%] hover:bg-vrclo1-50  transition-colors h-full border-2 border-transparent hover:border-vrclo1-200  overflow-hidden cursor-pointer"
          >
            <div className="aspect-square bg-vrclo1-100  flex items-center justify-center text-vrclo1-300">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
            </div>
            <CardFooter className="p-3 flex flex-col items-start">
              <span className="font-bold truncate w-full text-vrclo1-700">{item.name}</span>
            </CardFooter>
          </Card>
        ))}
        
        {props.data.length === 0 && (
          <div className="col-span-full text-center py-10 text-vrclo1-500 bg-vrclo1-50 rounded-lg border border-dashed">
            {trans.emptyMessage}
          </div>
        )}
        {props.data.length > maxVisible && (
          <Card 
            key="more"
            className="min-w-[10%] w-[10%] md:min-w-[8%] md:w-[8%] lg:min-w-[6%] lg:w-[6%] overflow-hidden bg-transparent border-transparent shadow-none text-vrclo1-400 transition-colors"
          >
            <div className="aspect-[1/4] flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <EllipsisIcon className="h-12 w-12" />
              </div>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
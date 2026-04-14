import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AppliesTo } from "../../src/domain/reference-content";
import {
  adminDeleteEbdIndication,
  adminDeleteLaserType,
  adminListEbdIndicationLaserTypeLinks,
  adminDeleteProviderService,
  adminDeleteServiceType,
  adminDeleteTreatmentArea,
  adminInsertEbdIndication,
  adminInsertLaserType,
  adminInsertProviderService,
  adminInsertServiceType,
  adminInsertTreatmentArea,
  adminListEbdIndications,
  adminListLaserTypes,
  adminListProviderServices,
  adminListServiceTypes,
  adminListTreatmentAreas,
  adminUpdateEbdIndication,
  adminUpdateLaserType,
  adminUpdateProviderService,
  adminUpdateServiceType,
  adminUpdateTreatmentArea,
  adminReplaceEbdIndicationLaserLinks,
  type AdminEbdIndicationRow,
  type AdminEbdLaserLinkRow,
  type AdminLaserTypeRow,
  type AdminProviderServiceRow,
  type AdminServiceTypeRow,
  type AdminTreatmentAreaRow,
  type TreatmentAreaRegionSlug,
} from "../../src/repositories/catalog-admin.repository";
import { fetchOwnProfileRow } from "../../src/repositories/profile.repository";
import { appStrings } from "../../src/strings/appStrings";
import { colors } from "../../src/theme/tokens";

type Tab = "laser" | "ebd" | "service" | "area" | "provider";

export default function CatalogAdminScreen() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("laser");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lasers, setLasers] = useState<AdminLaserTypeRow[]>([]);
  const [services, setServices] = useState<AdminServiceTypeRow[]>([]);
  const [areas, setAreas] = useState<AdminTreatmentAreaRow[]>([]);
  const [provSvcs, setProvSvcs] = useState<AdminProviderServiceRow[]>([]);
  const [ebdRows, setEbdRows] = useState<AdminEbdIndicationRow[]>([]);
  const [ebdLaserCatalog, setEbdLaserCatalog] = useState<AdminLaserTypeRow[]>([]);
  const [ebdLaserLinks, setEbdLaserLinks] = useState<AdminEbdLaserLinkRow[]>([]);
  const [laserLinkSavingEbdId, setLaserLinkSavingEbdId] = useState<string | null>(null);

  const gate = useCallback(async () => {
    const p = await fetchOwnProfileRow();
    setAllowed(Boolean(p?.is_admin));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void gate();
    }, [gate]),
  );

  const load = useCallback(async () => {
    if (!allowed) {
      return;
    }
    setLoading(true);
    try {
      if (tab === "laser") {
        setLasers(await adminListLaserTypes());
      } else if (tab === "ebd") {
        const [rows, lasers, links] = await Promise.all([
          adminListEbdIndications(),
          adminListLaserTypes(),
          adminListEbdIndicationLaserTypeLinks(),
        ]);
        setEbdRows(rows);
        setEbdLaserCatalog(lasers);
        setEbdLaserLinks(links);
      } else if (tab === "service") {
        setServices(await adminListServiceTypes());
      } else if (tab === "area") {
        setAreas(await adminListTreatmentAreas());
      } else {
        setProvSvcs(await adminListProviderServices());
      }
    } catch (e) {
      Alert.alert("Load failed", e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [allowed, tab]);

  useEffect(() => {
    if (allowed) {
      void load();
    }
  }, [allowed, tab, load]);

  const onAdd = async () => {
    try {
      if (tab === "laser") {
        await adminInsertLaserType();
      } else if (tab === "ebd") {
        await adminInsertEbdIndication();
      } else if (tab === "service") {
        await adminInsertServiceType();
      } else if (tab === "area") {
        await adminInsertTreatmentArea();
      } else {
        await adminInsertProviderService();
      }
      await load();
    } catch (e) {
      Alert.alert("Could not add", e instanceof Error ? e.message : String(e));
    }
  };

  if (allowed === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primaryNavy} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.padded}>
        <Text style={styles.denied}>{appStrings.catalogAdminAccessDenied}</Text>
        <Text style={styles.hint}>{appStrings.catalogAdminHint}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Text style={styles.topHint}>{appStrings.catalogAdminHint}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {(
          [
            ["laser", appStrings.catalogAdminLaserTab],
            ["ebd", appStrings.catalogAdminEbdTab],
            ["service", appStrings.catalogAdminServiceTab],
            ["area", appStrings.catalogAdminAreaTab],
            ["provider", appStrings.catalogAdminProviderTab],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabOn]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.addBtn} onPress={() => void onAdd()}>
        <Text style={styles.addBtnText}>{appStrings.catalogAdminAddRow}</Text>
      </Pressable>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryNavy} />
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {tab === "laser"
            ? lasers.map((r) => (
                <LaserEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateLaserType(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteLaserType(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "ebd"
            ? ebdRows.map((r) => (
                <EbdIndicationEditor
                  key={r.id}
                  row={r}
                  laserCatalog={ebdLaserCatalog}
                  linkedLaserTypeIds={ebdLaserLinks
                    .filter((x) => x.ebd_indication_id === r.id)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((x) => x.laser_type_id)}
                  laserLinksSaving={laserLinkSavingEbdId === r.id}
                  onToggleLaserType={async (laserTypeId) => {
                    const set = new Set(
                      ebdLaserLinks.filter((x) => x.ebd_indication_id === r.id).map((x) => x.laser_type_id),
                    );
                    if (set.has(laserTypeId)) {
                      set.delete(laserTypeId);
                    } else {
                      set.add(laserTypeId);
                    }
                    const nextIds = ebdLaserCatalog.filter((lt) => set.has(lt.id)).map((lt) => lt.id);
                    setLaserLinkSavingEbdId(r.id);
                    try {
                      await adminReplaceEbdIndicationLaserLinks(r.id, nextIds);
                      setEbdLaserLinks(await adminListEbdIndicationLaserTypeLinks());
                    } catch (e) {
                      Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setLaserLinkSavingEbdId(null);
                    }
                  }}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateEbdIndication(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteEbdIndication(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "service"
            ? services.map((r) => (
                <ServiceEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateServiceType(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteServiceType(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "area"
            ? areas.map((r) => (
                <AreaEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateTreatmentArea(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteTreatmentArea(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
          {tab === "provider"
            ? provSvcs.map((r) => (
                <ProviderSvcEditor
                  key={r.id}
                  row={r}
                  saving={savingId === r.id}
                  onSave={async (patch) => {
                    setSavingId(r.id);
                    try {
                      await adminUpdateProviderService(r.id, patch);
                      await load();
                    } catch (e) {
                      Alert.alert("Save failed", e instanceof Error ? e.message : String(e));
                    } finally {
                      setSavingId(null);
                    }
                  }}
                  onDelete={() => {
                    Alert.alert(
                      appStrings.catalogAdminDeleteConfirmTitle,
                      appStrings.catalogAdminDeleteConfirmBody,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: appStrings.catalogAdminDelete,
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await adminDeleteProviderService(r.id);
                                await load();
                              } catch (e) {
                                Alert.alert("Delete failed", e instanceof Error ? e.message : String(e));
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                />
              ))
            : null}
        </ScrollView>
      )}
    </View>
  );
}

function EbdIndicationEditor({
  row,
  laserCatalog,
  linkedLaserTypeIds,
  laserLinksSaving,
  onToggleLaserType,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminEbdIndicationRow;
  laserCatalog: AdminLaserTypeRow[];
  linkedLaserTypeIds: string[];
  laserLinksSaving: boolean;
  onToggleLaserType: (laserTypeId: string) => Promise<void>;
  saving: boolean;
  onSave: (p: Partial<AdminEbdIndicationRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [modality, setModality] = useState<"laser" | "photofacial">(row.modality);
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);

  useEffect(() => {
    setModality(row.modality);
    setName(row.name);
    setDescription(row.description);
    setSort(String(row.sort_order));
    setActive(row.is_active);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Modality</Text>
      <View style={styles.chips}>
        {(["laser", "photofacial"] as const).map((k) => (
          <Pressable key={k} style={[styles.chip, modality === k && styles.chipOn]} onPress={() => setModality(k)}>
            <Text style={[styles.chipText, modality === k && styles.chipTextOn]}>
              {k === "laser" ? appStrings.ebdModalityLaser : appStrings.ebdModalityPhotofacial}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardLabel}>Category name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <Text style={styles.cardLabel}>{appStrings.catalogAdminEbdAllowedDevicesLabel}</Text>
      {laserLinksSaving ? (
        <ActivityIndicator color={colors.primaryNavy} style={styles.ebdLaserLinksSpinner} />
      ) : null}
      <View style={styles.ebdLaserLinkList}>
        {laserCatalog.map((lt) => {
          const on = linkedLaserTypeIds.includes(lt.id);
          return (
            <Pressable
              key={lt.id}
              style={[styles.ebdLaserLinkRow, laserLinksSaving && styles.disabled]}
              disabled={laserLinksSaving}
              onPress={() => void onToggleLaserType(lt.id)}
            >
              <Text style={styles.ebdLaserLinkCheck}>{on ? "☑" : "☐"}</Text>
              <View style={styles.ebdLaserLinkMeta}>
                <Text style={styles.ebdLaserLinkName}>{lt.name}</Text>
                {!lt.is_active ? <Text style={styles.ebdLaserLinkInactive}>inactive</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              modality,
              name: name.trim(),
              description: description.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
            })
          }
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryNavy} />
          ) : (
            <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>
          )}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LaserEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminLaserTypeRow;
  saving: boolean;
  onSave: (p: Partial<AdminLaserTypeRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ServiceEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminServiceTypeRow;
  saving: boolean;
  onSave: (p: Partial<AdminServiceTypeRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [applies, setApplies] = useState<AppliesTo>(row.applies_to);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setApplies(row.applies_to);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Applies to</Text>
      <View style={styles.chips}>
        {(["injectable", "laser", "both"] as const).map((k) => (
          <Pressable key={k} style={[styles.chip, applies === k && styles.chipOn]} onPress={() => setApplies(k)}>
            <Text style={[styles.chipText, applies === k && styles.chipTextOn]}>
              {k === "injectable"
                ? appStrings.appliesToInjectable
                : k === "laser"
                  ? appStrings.appliesToLaser
                  : appStrings.appliesToBoth}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              applies_to: applies,
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const AREA_REGION_OPTIONS: { key: TreatmentAreaRegionSlug; label: string }[] = [
  { key: "head", label: appStrings.catalogAdminAreaBodyRegionHead },
  { key: "upper_body", label: appStrings.catalogAdminAreaBodyRegionUpper },
  { key: "lower_body", label: appStrings.catalogAdminAreaBodyRegionLower },
];

function AreaEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminTreatmentAreaRow;
  saving: boolean;
  onSave: (p: Partial<AdminTreatmentAreaRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [category, setCategory] = useState(row.category);
  const [region, setRegion] = useState<TreatmentAreaRegionSlug>(row.region);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setCategory(row.category);
    setRegion(row.region);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>{appStrings.catalogAdminAreaBodyRegion}</Text>
      <View style={styles.chips}>
        {AREA_REGION_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, region === opt.key && styles.chipOn]}
            onPress={() => setRegion(opt.key)}
          >
            <Text style={[styles.chipText, region === opt.key && styles.chipTextOn]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardLabel}>{appStrings.catalogAdminAreaCategoryNotes}</Text>
      <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              category: category.trim(),
              region,
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProviderSvcEditor({
  row,
  saving,
  onSave,
  onDelete,
}: {
  row: AdminProviderServiceRow;
  saving: boolean;
  onSave: (p: Partial<AdminProviderServiceRow>) => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [sort, setSort] = useState(String(row.sort_order));
  const [active, setActive] = useState(row.is_active);
  const [def, setDef] = useState(row.is_default);

  useEffect(() => {
    setName(row.name);
    setDescription(row.description);
    setSort(String(row.sort_order));
    setActive(row.is_active);
    setDef(row.is_default);
  }, [row]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholderTextColor={colors.textLight} />
      <Text style={styles.cardLabel}>Sort order</Text>
      <TextInput
        style={styles.input}
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        placeholderTextColor={colors.textLight}
      />
      <View style={styles.switchRow}>
        <Text>Active</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>
      <View style={styles.switchRow}>
        <Text>Default</Text>
        <Switch value={def} onValueChange={setDef} />
      </View>
      <View style={styles.cardActions}>
        <Pressable
          style={[styles.saveBtn, saving && styles.disabled]}
          disabled={saving}
          onPress={() =>
            void onSave({
              name: name.trim(),
              description: description.trim(),
              sort_order: Number.parseInt(sort, 10) || 0,
              is_active: active,
              is_default: def,
            })
          }
        >
          {saving ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.saveBtnText}>{appStrings.catalogAdminSave}</Text>}
        </Pressable>
        <Pressable style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delBtnText}>{appStrings.catalogAdminDelete}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightGray },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  padded: { flex: 1, padding: 20, backgroundColor: colors.lightGray },
  denied: { fontSize: 16, fontWeight: "600", color: colors.primaryNavy, marginBottom: 12 },
  hint: { color: colors.textSecondary, lineHeight: 22 },
  topHint: { padding: 12, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  tabs: { maxHeight: 48, paddingHorizontal: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  tabTextOn: { color: colors.primaryNavy },
  addBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.primaryNavy,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: { color: colors.cleanWhite, textAlign: "center", fontWeight: "700" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.cleanWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryGold,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnText: { fontWeight: "700", color: colors.primaryNavy },
  delBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.errorRed,
    justifyContent: "center",
  },
  delBtnText: { color: colors.errorRed, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.cleanWhite,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipOn: { backgroundColor: colors.primaryGold, borderColor: colors.primaryGold },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },
  chipTextOn: { color: colors.primaryNavy },
  ebdLaserLinksSpinner: { marginVertical: 8 },
  ebdLaserLinkList: { marginBottom: 10 },
  ebdLaserLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  ebdLaserLinkCheck: { fontSize: 18, marginRight: 10, color: colors.textPrimary },
  ebdLaserLinkMeta: { flex: 1 },
  ebdLaserLinkName: { fontSize: 15, color: colors.textPrimary },
  ebdLaserLinkInactive: { fontSize: 12, color: colors.textLight, marginTop: 2 },
});

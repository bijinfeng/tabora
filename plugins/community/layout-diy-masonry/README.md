# layout-diy-masonry

**Status: Incompatible (Phase 3 region protocol removal)**

This plugin demonstrated third-party layout extension using the region protocol (`LayoutViewProps`, `RegionSlot`, `LayoutInstance`). After Phase 3 region protocol collapse (2026-08), these types no longer exist in `@tabora/plugin-api/sdk`.

The code is preserved as an architectural reference for the original design, but cannot run in the current platform.

## Historical Context

This layout showed how plugin authors could:

- Consume `RegionSlot` abstractions to render dynamic instance lists
- Implement custom layout logic (masonry columns)
- Integrate with the platform's layout contribution system

After the refactor, the platform uses a single hardcoded dashboard layout with direct kind-based filtering instead of generic region routing.

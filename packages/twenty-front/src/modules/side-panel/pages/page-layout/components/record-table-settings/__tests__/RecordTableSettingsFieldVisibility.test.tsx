import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen, within } from '@testing-library/react';
import { type ReactNode } from 'react';

import { RecordTableSettingsFieldVisibility } from '@/side-panel/pages/page-layout/components/record-table-settings/RecordTableSettingsFieldVisibility';

const LABEL_IDENTIFIER_FIELD_METADATA_ID = 'id-field-metadata-id';

const makeFieldItem = ({
  fieldMetadataId,
  label,
  isVisible,
  position,
}: {
  fieldMetadataId: string;
  label: string;
  isVisible: boolean;
  position: number;
}) => ({
  viewField: {
    id: `view-field-${fieldMetadataId}`,
    fieldMetadataId,
    isVisible,
    position,
  },
  fieldMetadataItem: { id: fieldMetadataId, label, icon: 'IconUser' },
});

const mockUseRecordTableWidgetViewFieldItems = jest.fn();

jest.mock(
  '@/page-layout/widgets/record-table/hooks/useRecordTableWidgetViewFieldItems',
  () => ({
    useRecordTableWidgetViewFieldItems: () =>
      mockUseRecordTableWidgetViewFieldItems(),
  }),
);
jest.mock(
  '@/page-layout/widgets/record-table/hooks/useToggleRecordTableWidgetFieldVisibility',
  () => ({
    useToggleRecordTableWidgetFieldVisibility: () => ({
      toggleRecordTableWidgetFieldVisibility: jest.fn(),
    }),
  }),
);
jest.mock(
  '@/page-layout/widgets/record-table/hooks/useReorderRecordTableWidgetFields',
  () => ({
    useReorderRecordTableWidgetFields: () => ({
      reorderRecordTableWidgetFields: jest.fn(),
    }),
  }),
);
jest.mock('@/ui/layout/draggable-list/components/DraggableList', () => ({
  DraggableList: ({ draggableItems }: { draggableItems: ReactNode }) =>
    draggableItems,
}));
jest.mock('@/ui/layout/draggable-list/components/DraggableItem', () => ({
  DraggableItem: ({ itemComponent }: { itemComponent: ReactNode }) =>
    itemComponent,
}));
jest.mock('twenty-ui/components/navigation', () => ({
  MenuItemDraggable: ({
    text,
    iconButtons,
    isDragDisabled,
  }: {
    text: string;
    iconButtons?: ReactNode;
    isDragDisabled?: boolean;
  }) => (
    <div role="listitem" aria-label={text} aria-disabled={isDragDisabled}>
      {text}
      {iconButtons}
    </div>
  ),
}));

const renderFieldVisibility = () =>
  render(
    <I18nProvider i18n={i18n}>
      <RecordTableSettingsFieldVisibility
        viewId="view-id"
        widgetId="widget-id"
        pageLayoutId="page-layout-id"
      />
    </I18nProvider>,
  );

describe('RecordTableSettingsFieldVisibility', () => {
  beforeAll(() => {
    i18n.load('en', {});
    i18n.activate('en');
  });

  it('should pin the label identifier field so it cannot be hidden or moved', () => {
    mockUseRecordTableWidgetViewFieldItems.mockReturnValue({
      labelIdentifierFieldMetadataId: LABEL_IDENTIFIER_FIELD_METADATA_ID,
      recordTableWidgetViewFieldItems: [
        makeFieldItem({
          fieldMetadataId: 'roles-field-metadata-id',
          label: 'Roles',
          isVisible: true,
          position: 0,
        }),
        makeFieldItem({
          fieldMetadataId: LABEL_IDENTIFIER_FIELD_METADATA_ID,
          label: 'Id',
          isVisible: true,
          position: 1,
        }),
      ],
    });

    renderFieldVisibility();

    const fieldRows = screen.getAllByRole('listitem');

    expect(fieldRows.map((fieldRow) => fieldRow.textContent)).toEqual([
      'Id',
      'Roles',
    ]);

    const labelIdentifierRow = screen.getByRole('listitem', { name: 'Id' });

    expect(labelIdentifierRow).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(labelIdentifierRow).queryByRole('button', { name: 'Hide field' }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('listitem', { name: 'Roles' })).getByRole(
        'button',
        { name: 'Hide field' },
      ),
    ).toBeInTheDocument();
  });

  it('should keep a hidden label identifier field out of the hidden fields section', () => {
    mockUseRecordTableWidgetViewFieldItems.mockReturnValue({
      labelIdentifierFieldMetadataId: LABEL_IDENTIFIER_FIELD_METADATA_ID,
      recordTableWidgetViewFieldItems: [
        makeFieldItem({
          fieldMetadataId: LABEL_IDENTIFIER_FIELD_METADATA_ID,
          label: 'Id',
          isVisible: false,
          position: 0,
        }),
      ],
    });

    renderFieldVisibility();

    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show field' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Id' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

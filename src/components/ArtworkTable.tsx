import React, { useState, useEffect } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import axios from 'axios';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // Theme
import 'primereact/resources/primereact.min.css'; // Core CSS
import 'primeicons/primeicons.css'; // Icons
import 'primeflex/primeflex.css'; // Utilities

interface Artwork {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: number;
    date_end: number;
}

const ArtworkTable: React.FC = () => {
    const [artworks, setArtworks] = useState<Artwork[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedRows, setSelectedRows] = useState<{ [key: number]: boolean }>({});
    const [rowsToSelect, setRowsToSelect] = useState(0);

    const overlayPanelRef = React.useRef<OverlayPanel>(null);

    // Fetch artworks from the API
    const fetchArtworks = async (pageNumber: number) => {
        setLoading(true);
        try {
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}`);
            const { data, pagination } = response.data;
            setArtworks(data);
            setTotalRecords(pagination.total);
        } catch (error) {
            console.error('Error fetching artworks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial and page change effect
    useEffect(() => {
        fetchArtworks(page);
    }, [page]);

    // Handle row selection manually
    const handleRowSelect = (rowData: Artwork, selected: boolean) => {
        setSelectedRows((prev) => ({
            ...prev,
            [rowData.id]: selected,
        }));
    };

    // Render checkbox in the table
    const renderCheckbox = (rowData: Artwork) => {
        const isSelected = selectedRows[rowData.id] ?? false;
        return (
            <Checkbox
                checked={isSelected}
                onChange={(e) => handleRowSelect(rowData, e.checked!)}
            />
        );
    };

    // Handle page change
    const onPageChange = (event: DataTablePageEvent) => {
        setPage((event.page ?? 0) + 1);
    };

    // Handle row selection based on input
    const handleSelectRows = async () => {
        let remaining = rowsToSelect;
        const newSelections = { ...selectedRows };

        // Select rows from the current page
        for (const artwork of artworks) {
            if (remaining <= 0) break;
            if (!newSelections[artwork.id]) {
                newSelections[artwork.id] = true;
                remaining--;
            }
        }

        // Select rows from subsequent pages if needed
        let currentPage = page;
        while (remaining > 0) {
            currentPage++;
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${currentPage}`);
            const { data } = response.data;

            for (const artwork of data) {
                if (remaining <= 0) break;
                if (!newSelections[artwork.id]) {
                    newSelections[artwork.id] = true;
                    remaining--;
                }
            }
        }

        setSelectedRows(newSelections);
        overlayPanelRef.current?.hide();
    };

    return (
        <div>
            <div className="card">
                <DataTable
                    value={artworks}
                    paginator
                    rows={10}
                    totalRecords={totalRecords}
                    lazy
                    first={(page - 1) * 10}
                    onPage={onPageChange}
                    loading={loading}
                    selectionMode="checkbox"
                    selection={Object.keys(selectedRows)
                        .map((key) => artworks.find((a) => a.id === parseInt(key))!)
                        .filter(Boolean)}
                    onSelectionChange={(e) => setSelectedRows((prev) => ({ ...prev, ...e.value }))}
                    dataKey="id"
                >
                    <Column
                        header={
                            <div>
                                <span
                                    className="pi pi-chevron-down"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => overlayPanelRef.current?.toggle(e)}
                                />
                                <OverlayPanel ref={overlayPanelRef}>
                                    <div>
                                        <p>Enter the number of rows to select:</p>
                                        <InputNumber
                                            value={rowsToSelect}
                                            onValueChange={(e) => setRowsToSelect(e.value ?? 0)}
                                            min={0}
                                        />
                                        <Button
                                            label="Submit"
                                            icon="pi pi-check"
                                            className="p-button-sm mt-2"
                                            onClick={handleSelectRows}
                                        />
                                    </div>
                                </OverlayPanel>
                            </div>
                        }
                    ></Column>
                    <Column body={renderCheckbox} header="Select"></Column>
                    <Column field="title" header="Title"></Column>
                    <Column field="place_of_origin" header="Place of Origin"></Column>
                    <Column field="artist_display" header="Artist Display"></Column>
                    <Column field="inscriptions" header="Inscriptions"></Column>
                    <Column field="date_start" header="Start Date"></Column>
                    <Column field="date_end" header="End Date"></Column>
                </DataTable>
            </div>
        </div>
    );
};

export default ArtworkTable;

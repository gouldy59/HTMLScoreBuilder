import { TemplateComponent } from '@/types/template';

interface PageBreakComponentProps {
    component: TemplateComponent;
    onSelect?: () => void;
}

export function PageBreakComponent({
    component,
    onSelect,
}: PageBreakComponentProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.();
    };

    return (
        <div
            className="w-full flex justify-center items-center"
            style={{
                height: '40px',
                position: 'relative',
                cursor: 'pointer',
            }}
            onClick={handleClick}
        >
            <div className="w-full border-t-2 border-dashed border-blue-400" />
        </div>
    );
}

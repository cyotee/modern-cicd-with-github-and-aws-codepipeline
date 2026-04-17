import Header from '@cloudscape-design/components/header';

interface AppHeaderProps {
  hotelName: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ hotelName }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <Header variant="h1" description="Manage your hotel rooms">
          {hotelName}
        </Header>
      </div>
      <div style={{ flexShrink: 0 }}>
        <img 
          src={`${import.meta.env.BASE_URL}hotel_landing_pic.png`}
          alt="Hotel" 
          style={{ 
            height: '80px',
            width: 'auto',
            borderRadius: '8px'
          }} 
        />
      </div>
    </div>
  );
};

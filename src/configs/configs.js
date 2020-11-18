const server = 1;


switch (server) {
    case 0: // Production
      baseUrl = 'https://trading.simasnet.com/API_Absensi/';
      break;
    case 1: // Staging
      baseUrl = 'https://trading.simasnet.com/API_Absensi/';
      break;
    default:
  }
  
  const Config = {
    CheckAPI: {
      CheckUID : `${baseUrl}check_UID_HP.php`,
      // CheckNIK: `${baseUrl}check_NIK.php`,
      CheckNIK: `${baseUrl}check_NIK_Enhch.php`
    },
    AttendanceAPI:{
      Entry : `${baseUrl}exec_Entry_Absensi.php`
    },
    LoggingAPI:{
      Logger : `${baseUrl}logger.php`
    },
    ClockAPI:{
      Clock: `${baseUrl}servertime.php`
    }
  };
  
  export default Config;
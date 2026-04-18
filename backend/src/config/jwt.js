const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d'
};

// Validate that JWT_SECRET is loaded
if (!jwtConfig.secret) {
    console.error('CRITICAL: JWT_SECRET is not defined in environment variables!');
    console.error('Please check your .env file');
    process.exit(1);
}

export default jwtConfig;
